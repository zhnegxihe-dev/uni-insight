import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { favoriteTarget } from "@/lib/star";
import { recordAction, tagsOfExperiencePost } from "@/lib/recommend";
import { notify } from "@/lib/social";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const post = await prisma.experiencePost.findUnique({
    where: { id },
    include: {
      school: { select: { name: true } },
      major: { select: { name: true } },
    },
  });
  if (!post) return NextResponse.json({ error: "帖子不存在" }, { status: 404 });

  const result = await favoriteTarget(user.id, "experience_post", id);
  if (result.active) {
    await recordAction(user.id, { actionType: "favorite", targetType: "experience_post", targetId: id, tags: tagsOfExperiencePost(post) });
  }
  if (result.active && post.authorId !== user.id) {
    await notify(post.authorId, "favorite", { type: "favorite", actorId: user.id, postId: post.id, postTitle: post.title });
  }
  return NextResponse.json(result);
}