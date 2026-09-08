import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { POST_TYPES, SCENARIOS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { allSoftAdHits, checkContentForUser, moderationErrorMessage } from "@/lib/moderation";
import { hotScorePost, recordAction, tagsOfExperiencePost } from "@/lib/recommend";

const IMAGE_PREFIX = /^data:image\/(png|jpeg|webp|gif);base64,/;
const MAX_IMAGES = 6;
const MAX_IMAGE_LENGTH = 3_500_000;

/** 校验图片数组：仅允许压缩后的 data URL 图片 */
function validateImages(raw: unknown): { ok: boolean; images: string[]; error?: string } {
  if (raw === undefined || raw === null) return { ok: true, images: [] };
  if (!Array.isArray(raw)) return { ok: false, images: [], error: "图片格式不正确" };
  const images = raw
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES);
  if (images.length > MAX_IMAGES) return { ok: false, images: [], error: `最多上传 ${MAX_IMAGES} 张图片` };
  for (const img of images) {
    if (!IMAGE_PREFIX.test(img) || img.length > MAX_IMAGE_LENGTH) {
      return { ok: false, images: [], error: "图片格式不受支持（仅支持 png/jpeg/webp/gif）" };
    }
  }
  return { ok: true, images };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  const scenario = url.searchParams.get("scenario") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim();

  const where: Prisma.ExperiencePostWhereInput = { status: { not: "hidden" } };
  if (type === "promo") {
    where.postType = "promo"; // 推广池
  } else if (POST_TYPES.some((p) => p.key === type)) {
    where.postType = type;
  } else {
    where.postType = { not: "promo" }; // 信任池默认排除推广帖
  }
  if (scenario && SCENARIOS.some((s) => s.type === scenario)) where.scenarioType = scenario;
  if (q) where.OR = [{ title: { contains: q } }, { content: { contains: q } }];

  const posts = await prisma.experiencePost.findMany({
    where,
    include: {
      author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      school: { select: { id: true, name: true, slug: true } },
      major: { select: { id: true, name: true, slug: true } },
      merchant: { select: { id: true, name: true, tier: true, category: true } },
    },
    take: 60,
  });

  const sorted = [...posts].sort((a, b) => hotScorePost(b) - hotScorePost(a));
  return NextResponse.json({
    ok: true,
    items: sorted.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      postType: post.postType,
      scenarioType: post.scenarioType,
      merchantName: post.merchantName,
      merchant: post.merchant ?? null,
      images: JSON.parse(post.images) as string[],
      likeCount: post.likeCount,
      favoriteCount: post.favoriteCount,
      status: post.status,
      createdAt: post.createdAt,

      fromReply: Boolean(post.sourceReplyId),
      author: post.author,
      school: post.school,
      major: post.major,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim().slice(0, 100);
  const content = String(body.content ?? "").trim().slice(0, 3000);
  const postType = String(body.postType ?? "experience");
  const scenarioType = body.scenarioType ? String(body.scenarioType) : null;
  const schoolId = body.schoolId ? String(body.schoolId) : null;
  const majorId = body.majorId ? String(body.majorId) : null;
  const courseId = body.courseId ? String(body.courseId) : null;
  const teacherId = body.teacherId ? String(body.teacherId) : null;
  const merchantName = body.merchantName ? String(body.merchantName).trim().slice(0, 50) : null;
  const merchantId = body.merchantId ? String(body.merchantId) : null;
  const images = validateImages(body.images);
  const sourceReplyId = body.sourceReplyId ? String(body.sourceReplyId) : null;
  const sourceQuestionId = body.sourceQuestionId ? String(body.sourceQuestionId) : null;
  const mode = body.mode === "quote" ? "quote" : "upgrade"; // upgrade=升级自己的回复；quote=引用他人回复发帖
  if (!images.ok) return NextResponse.json({ error: images.error }, { status: 400 });

  if (!title) return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "请填写正文" }, { status: 400 });
  if (!POST_TYPES.some((p) => p.key === postType)) {
    return NextResponse.json({ error: "帖子类型不正确" }, { status: 400 });
  }
  if (postType === "promo" && !merchantName && !merchantId) {
    return NextResponse.json({ error: "推广帖必须填写商户名称" }, { status: 400 });
  }
  if (scenarioType && !SCENARIOS.some((s) => s.type === scenarioType)) {
    return NextResponse.json({ error: "场景类型不正确" }, { status: 400 });
  }

  // 广告词库 + 正则拦截（标题 + 正文）
  // 推广帖（promo）允许中性营销词（推广/广告/宣传等），但联系方式/承诺/收款等硬信号仍全拦
  const titleCheck = checkContentForUser(title, user.level);
  const contentCheck = checkContentForUser(content, user.level);
  if (!titleCheck.ok && !(postType === "promo" && allSoftAdHits(titleCheck.hits))) {
    return NextResponse.json({ error: moderationErrorMessage(titleCheck) }, { status: 400 });
  }
  if (!contentCheck.ok && !(postType === "promo" && allSoftAdHits(contentCheck.hits))) {
    return NextResponse.json({ error: moderationErrorMessage(contentCheck) }, { status: 400 });
  }

  // 关联档案存在性校验
  if (schoolId && !(await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } }))) {
    return NextResponse.json({ error: "关联学校不存在" }, { status: 400 });
  }
  if (majorId && !(await prisma.major.findUnique({ where: { id: majorId }, select: { id: true } }))) {
    return NextResponse.json({ error: "关联专业不存在" }, { status: 400 });
  }
  if (courseId && !(await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }))) {
    return NextResponse.json({ error: "关联课程不存在" }, { status: 400 });
  }
  if (teacherId && !(await prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } }))) {
    return NextResponse.json({ error: "关联教师不存在" }, { status: 400 });
  }

  // —— 商户关联（v4.7 §8.17）：promo 帖必须关联商户；仅填名称时按名称查找或自动建档（street）——
  let merchant: { id: string; name: string; tier: string; category: string } | null = null;
  if (merchantId) {
    const found = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, name: true, tier: true, category: true, status: true },
    });
    if (!found || found.status !== "active") {
      return NextResponse.json({ error: "商户不存在或不可用，请重新选择" }, { status: 400 });
    }
    merchant = found;
  } else if (postType === "promo" && merchantName) {
    merchant = await prisma.merchant.findFirst({
      where: { name: merchantName, status: "active" },
      select: { id: true, name: true, tier: true, category: true },
    });
    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: { name: merchantName, category: "campus_food", tier: "street", schoolId },
        select: { id: true, name: true, tier: true, category: true },
      });
    }
  }

  // —— 回复升级为帖子（蓝图 v4.6 §8.16）：仅允许升级自己可见的回复，同一条回复只能升级一次 ——
  let sourceReply: { id: string; questionId: string; authorId: string; status: string; content: string } | null = null;
  if (sourceReplyId) {
    sourceReply = await prisma.reply.findUnique({
      where: { id: sourceReplyId },
      select: { id: true, questionId: true, authorId: true, status: true, content: true },
    });
    if (!sourceReply) return NextResponse.json({ error: "来源回复不存在" }, { status: 400 });
    if (sourceReply.status === "hidden") return NextResponse.json({ error: "来源回复已被隐藏，无法升级" }, { status: 400 });
    if (sourceReply.authorId !== user.id && mode !== "quote") {
      return NextResponse.json({ error: "只能将自己发布的回复升级为帖子；引用他人的回复请使用「引用发帖」" }, { status: 400 });
    }
    if (mode === "quote") {
      const ownPart = content
        .split(sourceReply.content)
        .join("")
        .replace(/[\s“”"「」『』《》【】（）()：:，,。.、；;…\-]+/g, "");
      if (ownPart.length < 10) return NextResponse.json({ error: "引用发帖需在原回复基础上补充至少 10 字自己的内容" }, { status: 400 });
    }
    if (sourceQuestionId && sourceReply.questionId !== sourceQuestionId) {
      return NextResponse.json({ error: "来源问题与回复不匹配" }, { status: 400 });
    }
    const existingUpgrade = await prisma.experiencePost.findFirst({
      where: { sourceReplyId, authorId: user.id },
      select: { id: true },
    });
    if (existingUpgrade) return NextResponse.json({ error: "这条回复你已升级/引用过帖子了" }, { status: 400 });
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const upgradeToday = await prisma.experiencePost.count({
      where: { authorId: user.id, sourceReplyId: { not: null }, createdAt: { gte: dayStart } },
    });
    if (upgradeToday >= 5) return NextResponse.json({ error: "今日回复升级帖子已达上限（5 次），明天再来吧" }, { status: 400 });
  }

  const post = await prisma.experiencePost.create({
    data: {
      authorId: user.id,
      title,
      content,
      postType,
      scenarioType,
      schoolId,
      majorId,
      courseId,
      teacherId,
      merchantName: merchant ? merchant.name : merchantName,
      merchantId: merchant?.id ?? null,
      images: JSON.stringify(images.images),
      sourceReplyId: sourceReply?.id ?? null,
      sourceQuestionId: sourceReply?.questionId ?? (sourceQuestionId || null),
    },
    select: { id: true },
  });

  // 标注商家推广 → 诚信分 +5（当日上限 5 篇，防止刷分）
  if (postType === "promo") {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const promoToday = await prisma.experiencePost.count({
      where: { authorId: user.id, postType: "promo", createdAt: { gte: dayStart } },
    });
    if (promoToday <= 5) {
      await prisma.user.update({ where: { id: user.id }, data: { trustScore: { increment: 5 } } });
    }
  }

  // 引用他人回复发帖：通知被引用作者
  if (sourceReply && mode === "quote" && sourceReply.authorId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: sourceReply.authorId,
        type: "reply",
        payload: JSON.stringify({
          type: "quote",
          actorId: user.id,
          postId: post.id,
          postKind: "experience_post",
          questionId: sourceReply.questionId,
        }),
      },
    });
  }

  // 发帖行为写入画像（内容标签反向加到作者向量）
  const schoolName = schoolId ? (await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }))?.name : null;
  const majorName = majorId ? (await prisma.major.findUnique({ where: { id: majorId }, select: { name: true } }))?.name : null;
  await recordAction(user.id, {
    actionType: "post",
    targetType: "experience_post",
    targetId: post.id,
    tags: tagsOfExperiencePost({
      postType,
      scenarioType,
      school: schoolName ? { name: schoolName } : null,
      major: majorName ? { name: majorName } : null,
    }),
  });

  return NextResponse.json({ ok: true, id: post.id });
}