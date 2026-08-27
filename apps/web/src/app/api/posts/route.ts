import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { POST_TYPES, SCENARIOS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { checkContentForUser, moderationErrorMessage } from "@/lib/moderation";
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
  if (POST_TYPES.some((p) => p.key === type)) where.postType = type;
  if (scenario && SCENARIOS.some((s) => s.type === scenario)) where.scenarioType = scenario;
  if (q) where.OR = [{ title: { contains: q } }, { content: { contains: q } }];

  const posts = await prisma.experiencePost.findMany({
    where,
    include: {
      author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      school: { select: { id: true, name: true, slug: true } },
      major: { select: { id: true, name: true, slug: true } },
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
      images: JSON.parse(post.images) as string[],
      likeCount: post.likeCount,
      favoriteCount: post.favoriteCount,
      status: post.status,
      createdAt: post.createdAt,
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
  const images = validateImages(body.images);
  if (!images.ok) return NextResponse.json({ error: images.error }, { status: 400 });

  if (!title) return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "请填写正文" }, { status: 400 });
  if (!POST_TYPES.some((p) => p.key === postType)) {
    return NextResponse.json({ error: "帖子类型不正确" }, { status: 400 });
  }
  if (scenarioType && !SCENARIOS.some((s) => s.type === scenarioType)) {
    return NextResponse.json({ error: "场景类型不正确" }, { status: 400 });
  }

  // 广告词库 + 正则拦截（标题 + 正文）
  const titleCheck = checkContentForUser(title, user.level);
  const contentCheck = checkContentForUser(content, user.level);
  if (!titleCheck.ok) return NextResponse.json({ error: moderationErrorMessage(titleCheck) }, { status: 400 });
  if (!contentCheck.ok) return NextResponse.json({ error: moderationErrorMessage(contentCheck) }, { status: 400 });

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
      images: JSON.stringify(images.images),
    },
    select: { id: true },
  });

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