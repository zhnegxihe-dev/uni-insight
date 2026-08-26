import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recomputeUserStar } from "@/lib/star";
import { notify } from "@/lib/social";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await params;
  const reply = await prisma.reply.findUnique({ where: { id } });
  if (!reply) return NextResponse.json({ error: "回复不存在" }, { status: 404 });

  const question = await prisma.question.findUnique({ where: { id: reply.questionId } });
  if (!question) return NextResponse.json({ error: "问题不存在" }, { status: 404 });
  if (question.isLocked) return NextResponse.json({ error: "问题已锁定，不能采纳回复" }, { status: 403 });
  if (question.authorId !== user.id) {
    return NextResponse.json({ error: "只有提问者可以采纳回复" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.reply.updateMany({
      where: { questionId: question.id, isAccepted: true },
      data: { isAccepted: false },
    }),
    prisma.reply.update({
      where: { id: reply.id },
      data: { isAccepted: true },
    }),
    prisma.question.update({
      where: { id: question.id },
      data: { acceptedReplyId: reply.id },
    }),
  ]);

  await recomputeUserStar(reply.authorId);
  if (reply.authorId !== user.id) {
    await notify(reply.authorId, "accept", {
      type: "accept",
      actorId: user.id,
      questionId: question.id,
      questionTitle: question.title,
      replyId: reply.id,
    });
  }
  return NextResponse.json({ ok: true });
}
