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
  const post = await prisma.aiPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "精选帖不存在" }, { status: 404 });

  const result = await starTarget(user.id, "ai_post", id);
  if (result.active) {
    const source = post.questionId
      ? await prisma.question.findUnique({ where: { id: post.questionId }, include: { tags: { include: { tag: { select: { name: true, type: true } } } } } })
      : null;
    await recordAction(user.id, { actionType: "star", targetType: "ai_post", targetId: id, tags: source ? tagsOfQuestion(source) : [] });
  }
  await recomputeUserStar(post.authorId);
  if (result.active && post.authorId !== user.id) {
    await notify(post.authorId, "star", { type: "star", actorId: user.id, postId: post.id, postTitle: post.title });
  }
  return NextResponse.json(result);
}
