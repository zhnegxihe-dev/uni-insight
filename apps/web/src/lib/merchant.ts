import { prisma } from "@/lib/prisma";
import { MERCHANT_MIN_REVIEWS, MERCHANT_REVIEW_DIMS } from "@/lib/core";
import { hotScorePost } from "@/lib/recommend";

function safeJson<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export interface MerchantReviewItem {
  id: string;
  rating: number;
  dims: Record<string, number>;
  content: string;
  isAnonymous: boolean;
  merchantReply: string | null;
  merchantRepliedAt: Date | null;
  createdAt: Date;
  author: { id: string; nickname: string; verifiedSchools: string; level: number } | null;
  isPromoter: boolean;
}

export async function loadMerchantDetail(id: string, viewerId?: string | null) {
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: { school: { select: { id: true, name: true, slug: true } } },
  });
  if (!merchant || merchant.status === "removed") return null;

  const [posts, legacyPosts, reviewRows, promoters, owner] = await Promise.all([
    prisma.experiencePost.findMany({
      where: { merchantId: id, status: { not: "hidden" } },
      include: {
        author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
        school: { select: { id: true, name: true, slug: true } },
        major: { select: { id: true, name: true, slug: true } },
      },
      take: 100,
    }),
    prisma.experiencePost.findMany({
      where: { merchantId: null, merchantName: merchant.name, status: { not: "hidden" } },
      include: {
        author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
        school: { select: { id: true, name: true, slug: true } },
        major: { select: { id: true, name: true, slug: true } },
      },
      take: 100,
    }),
    prisma.merchantReview.findMany({
      where: { merchantId: id, status: "visible" },
      include: {
        author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.experiencePost.findMany({
      where: { merchantId: id, postType: "promo", status: { not: "hidden" } },
      select: { authorId: true },
    }),
    merchant.ownerId
      ? prisma.user.findUnique({ where: { id: merchant.ownerId }, select: { id: true, nickname: true } })
      : Promise.resolve(null),
  ]);

  const mergedPosts = [...posts, ...legacyPosts].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const sortedPosts = [...mergedPosts].sort((a, b) => hotScorePost(b) - hotScorePost(a));

  // 三方制衡：曾为该商户发过付费推广的用户，其评价不计入评分（避免既当运动员又当裁判）
  const promoterIds = new Set(promoters.map((p) => p.authorId));
  const scored = reviewRows.filter((r) => !promoterIds.has(r.authorId));
  const rating = scored.length ? scored.reduce((s, r) => s + r.rating, 0) / scored.length : 0;
  const dimDefs = MERCHANT_REVIEW_DIMS[merchant.category] ?? [];
  const dims = dimDefs.map((d) => {
    const values = scored
      .map((r) => safeJson<Record<string, number>>(r.dims, {})[d.key])
      .filter((v): v is number => typeof v === "number" && v >= 1 && v <= 5);
    return {
      key: d.key,
      label: d.label,
      value: values.length ? Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)) : 0,
    };
  });

  const reviews: MerchantReviewItem[] = reviewRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    dims: safeJson<Record<string, number>>(r.dims, {}),
    content: r.content,
    isAnonymous: r.isAnonymous,
    merchantReply: r.merchantReply,
    merchantRepliedAt: r.merchantRepliedAt,
    createdAt: r.createdAt,
    author: r.isAnonymous ? null : r.author,
    isPromoter: promoterIds.has(r.authorId),
  }));

  const myReview = viewerId ? reviews.find((r) => r.author?.id === viewerId) ?? null : null;
  const canReply = Boolean(merchant.ownerId && viewerId && merchant.ownerId === viewerId);

  return {
    merchant,
    owner,
    posts: sortedPosts,
    reviews,
    myReview,
    canReply,
    dimDefs,
    stats: {
      reviewCount: reviewRows.length,
      scoredCount: scored.length,
      rating: Number(rating.toFixed(1)),
      insufficient: scored.length < MERCHANT_MIN_REVIEWS,
      promoterExcluded: reviewRows.length - scored.length,
      dims,
    },
  };
}
