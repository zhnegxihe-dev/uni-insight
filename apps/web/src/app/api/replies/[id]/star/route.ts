import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recomputeUserStar, starTarget } from "@/lib/star";
import { recordAction, tagsOfQuestion } from "@/lib/recommend";
import { notify } from "@/lib/social";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const reply = await prisma.reply.findUnique({ where: { id }, include: { question: { include: { tags: { include: { tag: { select: { name: true, type: true } } } } } } } });
  if (!reply) return NextResponse.json({ error: "回复不存在" }, { status: 404 });

  const result = await starTarget(user.id, "reply", id);
  if (result.active) {
    await recordAction(user.id, { actionType: "star", targetType: "reply", targetId: id, tags: tagsOfQuestion(reply.question) });
  }
  await recomputeUserStar(reply.authorId);
  if (result.active && reply.authorId !== user.id) {
    await notify(reply.authorId, "star", { type: "star", actorId: user.id, replyId: reply.id, questionId: reply.questionId });
  }
  return NextResponse.json(result);
}
