import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recomputeUserStar, starTarget } from "@/lib/star";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const post = await prisma.aiPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "精选帖不存在" }, { status: 404 });

  const result = await starTarget(user.id, "ai_post", id);
  await recomputeUserStar(post.authorId);
  return NextResponse.json(result);
}
