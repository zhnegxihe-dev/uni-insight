import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hotScorePost } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: {
      school: { select: { id: true, name: true, slug: true } },
      posts: {
        where: { status: { not: "hidden" } },
        include: {
          author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
          school: { select: { id: true, name: true, slug: true } },
          major: { select: { id: true, name: true, slug: true } },
        },
        take: 100,
      },
    },
  });
  if (!merchant || merchant.status === "removed") {
    return NextResponse.json({ error: "商户不存在或已下架" }, { status: 404 });
  }
  // 兼容历史数据：无 merchantId 但 merchantName 匹配的推广帖也归入该商户
  const legacyPosts = await prisma.experiencePost.findMany({
    where: {
      status: { not: "hidden" },
      merchantId: null,
      merchantName: merchant.name,
    },
    include: {
      author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      school: { select: { id: true, name: true, slug: true } },
      major: { select: { id: true, name: true, slug: true } },
    },
    take: 100,
  });
  const owner = merchant.ownerId
    ? await prisma.user.findUnique({
        where: { id: merchant.ownerId },
        select: { id: true, nickname: true },
      })
    : null;
  const posts = [...merchant.posts, ...legacyPosts].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );
  const sorted = [...posts].sort((a, b) => hotScorePost(b) - hotScorePost(a));
  return NextResponse.json({
    ok: true,
    merchant: {
      id: merchant.id,
      name: merchant.name,
      category: merchant.category,
      tier: merchant.tier,
      claimStatus: merchant.claimStatus,
      schoolId: merchant.schoolId,
      city: merchant.city,
      address: merchant.address,
      description: merchant.description,
      coverImages: JSON.parse(merchant.coverImages) as string[],
      creditScore: merchant.creditScore,
      createdAt: merchant.createdAt,
      school: merchant.school,
      owner,
      postCount: sorted.length,
    },
    posts: sorted.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      postType: p.postType,
      scenarioType: p.scenarioType,
      merchantName: p.merchantName,
      images: JSON.parse(p.images) as string[],
      likeCount: p.likeCount,
      favoriteCount: p.favoriteCount,
      status: p.status,
      createdAt: p.createdAt,
      fromReply: Boolean(p.sourceReplyId),
      author: p.author,
      school: p.school,
      major: p.major,
    })),
  });
}
