import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { loadMerchantDetail } from "@/lib/merchant";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const detail = await loadMerchantDetail(id, user?.id ?? null);
  if (!detail) return NextResponse.json({ error: "商户不存在或已下架" }, { status: 404 });
  const { merchant, owner, posts, reviews, stats } = detail;
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
      postCount: posts.length,
    },
    stats,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      dims: r.dims,
      content: r.content,
      isAnonymous: r.isAnonymous,
      merchantReply: r.merchantReply,
      merchantRepliedAt: r.merchantRepliedAt,
      createdAt: r.createdAt,
      author: r.author,
      isPromoter: r.isPromoter,
    })),
    posts: posts.map((p) => ({
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
