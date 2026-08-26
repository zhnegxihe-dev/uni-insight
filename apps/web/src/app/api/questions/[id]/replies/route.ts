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

  const reply = await prisma.reply.create({
    data: { questionId: id, authorId: user.id, content },
    select: { id: true },
  });
  await prisma.question.update({
    where: { id },
    data: { replyCount: { increment: 1 } },
  });
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
