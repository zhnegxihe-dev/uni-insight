import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { checkContentForUser, moderationErrorMessage } from "@/lib/moderation";
import { notify } from "@/lib/social";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const content = String(body.content ?? "").trim();
  const parentReplyId = body.parentReplyId ? String(body.parentReplyId) : null;
  if (!content) return NextResponse.json({ error: "回复内容不能为空" }, { status: 400 });
  if (content.length > 280) return NextResponse.json({ error: "回复最多 280 字" }, { status: 400 });

  // 广告词库 + 正则拦截
  const check = checkContentForUser(content, user.level);
  if (!check.ok) {
    return NextResponse.json({ error: moderationErrorMessage(check) }, { status: 400 });
  }

  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return NextResponse.json({ error: "问题不存在" }, { status: 404 });
  if (question.isLocked) return NextResponse.json({ error: "问题已锁定" }, { status: 403 });
  if (question.status === "hidden") return NextResponse.json({ error: "问题已隐藏，无法回复" }, { status: 403 });

  // 一级追问：parentReplyId 只能指向本问题下的可见“根回复”，且追问只允许一层
  let parentReply: { id: string; authorId: string; questionId: string; status: string; parentReplyId: string | null } | null = null;
  if (parentReplyId) {
    parentReply = await prisma.reply.findUnique({
      where: { id: parentReplyId },
      select: { id: true, authorId: true, questionId: true, status: true, parentReplyId: true },
    });
    if (!parentReply) return NextResponse.json({ error: "要回复的回复不存在" }, { status: 400 });
    if (parentReply.questionId !== id) return NextResponse.json({ error: "只能回复同一问题下的回复" }, { status: 400 });
    if (parentReply.status === "hidden") return NextResponse.json({ error: "该回复已被隐藏，无法追问" }, { status: 400 });
    if (parentReply.parentReplyId) return NextResponse.json({ error: "追问只支持一层，请回到原回复下继续" }, { status: 400 });
  }

  const reply = await prisma.reply.create({
    data: { questionId: id, authorId: user.id, content, parentReplyId: parentReply?.id ?? null },
    select: { id: true },
  });
  await prisma.question.update({
    where: { id },
    data: { replyCount: { increment: 1 } },
  });
  if (parentReply && parentReply.authorId !== user.id && parentReply.authorId !== question.authorId) {
    await notify(parentReply.authorId, "reply", {
      type: "reply",
      actorId: user.id,
      questionId: id,
      questionTitle: question.title,
      replyId: reply.id,
      parentReply: true,
    });
  }
  if (question.authorId !== user.id) {
    await notify(question.authorId, "reply", {
      type: "reply",
      actorId: user.id,
      questionId: id,
      questionTitle: question.title,
      replyId: reply.id,
    });
  }
  return NextResponse.json({ ok: true, id: reply.id });
}
