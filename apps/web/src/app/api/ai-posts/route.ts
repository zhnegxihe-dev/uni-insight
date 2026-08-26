import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateSummary } from "@/lib/ai";
import { safeParse } from "@/lib/format";
import { checkContentForUser, moderationErrorMessage } from "@/lib/moderation";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (user.level < 2) {
    return NextResponse.json({ error: "L2 及以上才能发布 AI 精选帖" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const rawReplyIds = Array.isArray(body.replyIds) ? body.replyIds.map((id: unknown) => String(id)) : [];
  const questionId = body.questionId ? String(body.questionId) : null;
  const customTitle = body.title ? String(body.title).trim().slice(0, 100) : "";
  if (rawReplyIds.length < 3 || rawReplyIds.length > 30) {
    return NextResponse.json({ error: "请选择 3-30 条回复" }, { status: 400 });
  }

  // 自定义标题同样过广告词库
  if (customTitle) {
    const check = checkContentForUser(customTitle, user.level);
    if (!check.ok) return NextResponse.json({ error: moderationErrorMessage(check) }, { status: 400 });
  }

  let questionTitle = "";
  if (questionId) {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return NextResponse.json({ error: "问题不存在" }, { status: 404 });
    questionTitle = question.title;
  }

  // 仅使用可见回复作为来源（自动过滤已折叠/已隐藏的广告内容）
  const replies = await prisma.reply.findMany({
    where: {
      id: { in: rawReplyIds },
      status: "visible",
      ...(questionId ? { questionId } : {}),
    },
    include: { author: { select: { nickname: true, verifiedSchools: true } } },
  });
  if (replies.length < 3) return NextResponse.json({ error: "有效回复不足 3 条" }, { status: 400 });

  const sourceQuestionIds = Array.from(new Set(replies.map((reply) => reply.questionId)));
  const sourceQuestions = sourceQuestionIds.length
    ? await prisma.question.findMany({
        where: { id: { in: sourceQuestionIds } },
        select: { id: true, title: true },
      })
    : [];

  const summary = await generateSummary(
    sourceQuestions.map((q) => q.title).join(" / ") || questionTitle,
    replies.map((reply) => ({
      content: reply.content,
      starCount: reply.starCount,
      nickname: reply.author.nickname,
      verified: safeParse<string[]>(reply.author.verifiedSchools, []).length > 0,
    }))
  );

  const title =
    customTitle ||
    (sourceQuestions.length === 1
      ? `关于「${sourceQuestions[0].title}」的 AI 精选总结`
      : `我的经验整合：${sourceQuestions.length} 个问题的回答精选`);

  const post = await prisma.aiPost.create({
    data: {
      authorId: user.id,
      questionId: questionId && sourceQuestions.length === 1 ? questionId : null,
      title,
      summaryJson: JSON.stringify(summary),
      selectedReplyIds: JSON.stringify(replies.map((reply) => reply.id)),
      sourceCount: replies.length,
      status: "published",
      publishedAt: new Date(),
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: post.id });
}
