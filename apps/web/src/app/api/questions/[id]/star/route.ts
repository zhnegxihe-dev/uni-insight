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
  const question = await prisma.question.findUnique({ where: { id }, include: { tags: { include: { tag: { select: { name: true, type: true } } } } } });
  if (!question) return NextResponse.json({ error: "问题不存在" }, { status: 404 });

  const result = await starTarget(user.id, "question", id);
  if (result.active) {
    await recordAction(user.id, { actionType: "star", targetType: "question", targetId: id, tags: tagsOfQuestion(question) });
  }
  await recomputeUserStar(question.authorId);
  if (result.active && question.authorId !== user.id) {
    await notify(question.authorId, "star", { type: "star", actorId: user.id, questionId: question.id, questionTitle: question.title });
  }
  return NextResponse.json(result);
}
