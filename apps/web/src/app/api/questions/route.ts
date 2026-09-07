import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { checkContentForUser, moderationErrorMessage } from "@/lib/moderation";

function slugify(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `t-${ascii || Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim().slice(0, 150);
  const description = body.description ? String(body.description).trim().slice(0, 300) : null;
  const scenarioType = String(body.scenarioType ?? "gaokao");
  const degreeLevel = String(body.degreeLevel ?? "bachelor");
  const tagNames = Array.isArray(body.tagNames)
    ? body.tagNames.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 5)
    : [];
  const scenarioMeta = body.scenarioMeta && typeof body.scenarioMeta === "object" ? body.scenarioMeta : {};
  const originQuestionId = body.originQuestionId ? String(body.originQuestionId) : null;
  const forkedFromReplyIds = Array.isArray(body.forkedFromReplyIds)
    ? body.forkedFromReplyIds.map((t: unknown) => String(t)).filter(Boolean).slice(0, 5)
    : body.forkedFromReplyId
      ? [String(body.forkedFromReplyId)]
      : [];

  if (!title) return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  if (!SCENARIOS.some((s) => s.type === scenarioType)) {
    return NextResponse.json({ error: "场景类型不正确" }, { status: 400 });
  }

  // —— 转新帖（fork，蓝图 v4.6 §8.16/§8.14）：携带引用快照，继承原问题场景与标签 ——
  let forkOrigin: { id: string; authorId: string; title: string; scenarioType: string; scenarioMeta: string; degreeLevel: string | null; status: string } | null = null;
  let forkReplies: { id: string; authorId: string; content: string }[] = [];
  if (originQuestionId && forkedFromReplyIds.length > 0) {
    forkOrigin = await prisma.question.findUnique({
      where: { id: originQuestionId },
      select: { id: true, authorId: true, title: true, scenarioType: true, scenarioMeta: true, degreeLevel: true, status: true },
    });
    if (!forkOrigin || forkOrigin.status === "hidden") return NextResponse.json({ error: "来源问题不存在或已被隐藏" }, { status: 400 });
    forkReplies = await prisma.reply.findMany({
      where: { id: { in: forkedFromReplyIds }, questionId: originQuestionId, status: { not: "hidden" } },
      select: { id: true, authorId: true, content: true },
    });
    if (forkReplies.length !== forkedFromReplyIds.length) {
      return NextResponse.json({ error: "引用的回复不存在或已被隐藏" }, { status: 400 });
    }
    const canFork =
      forkOrigin.authorId === user.id ||
      forkReplies.some((r) => r.authorId === user.id);
    if (!canFork) return NextResponse.json({ error: "只能转自己参与讨论的回复为帖子" }, { status: 403 });
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const forkToday = await prisma.question.count({
      where: { authorId: user.id, forkedFromQuestionId: { not: null }, createdAt: { gte: dayStart } },
    });
    if (forkToday >= 5) return NextResponse.json({ error: "今日转帖已达上限（5 次），明天再来吧" }, { status: 400 });
  }

  // 广告词库 + 正则拦截
  const titleCheck = checkContentForUser(title, user.level);
  const descCheck = description ? checkContentForUser(description, user.level) : { ok: true as const, hits: [] };
  if (!titleCheck.ok) {
    return NextResponse.json({ error: moderationErrorMessage(titleCheck) }, { status: 400 });
  }
  if (!descCheck.ok) {
    return NextResponse.json({ error: moderationErrorMessage(descCheck) }, { status: 400 });
  }

  // 转新帖：自动生成引用快照描述（只读，含来源），并继承来源问题的场景/学历/场景元数据
  let finalTitle = title;
  let finalDescription = description;
  let finalScenarioType = scenarioType;
  let finalDegreeLevel = degreeLevel;
  let finalScenarioMeta = scenarioMeta;
  if (forkOrigin) {
    const quoted = forkReplies
      .map((r) => `· @${r.authorId === user.id ? "我" : "对方"}：${r.content.slice(0, 90)}${r.content.length > 90 ? "…" : ""}`)
      .join("\n");
    finalDescription = (description ? description + "\n\n" : "") + `转自《${forkOrigin.title}》的讨论（引用快照，不可编辑）：\n${quoted}`.slice(0, 300);
    finalScenarioType = forkOrigin.scenarioType;
    finalDegreeLevel = forkOrigin.degreeLevel ?? "bachelor";
    finalScenarioMeta = JSON.parse(forkOrigin.scenarioMeta || "{}") as Record<string, unknown>;
  }

  const question = await prisma.question.create({
    data: {
      title: finalTitle,
      description: finalDescription,
      authorId: user.id,
      scenarioType: finalScenarioType,
      degreeLevel: finalDegreeLevel,
      scenarioMeta: JSON.stringify(finalScenarioMeta),
      forkedFromQuestionId: forkOrigin?.id ?? null,
      forkedFromReplyIds: JSON.stringify(forkReplies.map((r) => r.id)),
    },
  });

  if (forkOrigin) {
    const originTags = await prisma.questionTag.findMany({
      where: { questionId: forkOrigin.id },
      select: { tagId: true },
    });
    await prisma.questionTag.createMany({
      data: originTags.map((t) => ({ questionId: question.id, tagId: t.tagId })),
      skipDuplicates: true,
    });
    const actorNames = await prisma.user.findMany({
      where: { id: { in: forkReplies.map((r) => r.authorId) } },
      select: { id: true, nickname: true },
    });
    const actorMap = new Map(actorNames.map((a) => [a.id, a.nickname]));
    for (const r of forkReplies) {
      if (r.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: r.authorId,
            type: "reply",
            payload: JSON.stringify({
              type: "fork",
              actorId: user.id,
              questionId: question.id,
              questionTitle: finalTitle,
              originQuestionTitle: forkOrigin.title,
            }),
          },
        });
      }
    }
  }

  for (const name of tagNames) {
    const existing = await prisma.tag.findFirst({ where: { name } });
    const tag =
      existing ??
      (await prisma.tag.create({
        data: { name, slug: slugify(name), type: "custom" },
      }));
    await prisma.questionTag.create({
      data: { questionId: question.id, tagId: tag.id },
    });
  }

  return NextResponse.json({ ok: true, id: question.id });
}
