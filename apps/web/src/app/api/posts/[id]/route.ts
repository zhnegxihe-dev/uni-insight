import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.experiencePost.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, verifiedSchools: true, level: true, bio: true } },
      school: { select: { id: true, name: true, slug: true } },
      major: { select: { id: true, name: true, slug: true } },
      course: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true, title: true } },
    },
  });
  if (!post) return NextResponse.json({ error: "帖子不存在" }, { status: 404 });

  const user = await getSessionUser();
  let liked = false;
  let favorited = false;
  if (user) {
    const [like, fav] = await Promise.all([
      prisma.contentStar.findUnique({
        where: { userId_targetType_targetId: { userId: user.id, targetType: "experience_post", targetId: id } },
      }),
      prisma.contentFavorite.findUnique({
        where: { userId_targetType_targetId: { userId: user.id, targetType: "experience_post", targetId: id } },
      }),
    ]);
    liked = Boolean(like);
    favorited = Boolean(fav);
  }

  return NextResponse.json({
    ok: true,
    post: {
      id: post.id,
      title: post.title,
      content: post.content,
      postType: post.postType,
      scenarioType: post.scenarioType,
      images: JSON.parse(post.images) as string[],
      likeCount: post.likeCount,
      favoriteCount: post.favoriteCount,
      status: post.status,
      createdAt: post.createdAt,
      author: post.author,
      school: post.school,
      major: post.major,
      course: post.course,
      teacher: post.teacher,
      liked,
      favorited,
    },
  });
}