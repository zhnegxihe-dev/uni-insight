import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronLeft, MapPin, Plus, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { hotScorePost } from "@/lib/recommend";
import { MERCHANT_CATEGORIES, MERCHANT_TIERS, POST_TYPES } from "@/lib/core";
import { ExperiencePostCard } from "@/components/ExperiencePostCard";

export const dynamic = "force-dynamic";

export default async function MerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: {
      school: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!merchant || merchant.status === "removed") notFound();

  const [posts, legacyPosts, owner] = await Promise.all([
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
    merchant.ownerId
      ? prisma.user.findUnique({ where: { id: merchant.ownerId }, select: { id: true, nickname: true } })
      : Promise.resolve(null),
  ]);
  const merged = [...posts, ...legacyPosts].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const sorted = [...merged].sort((a, b) => hotScorePost(b) - hotScorePost(a));

  const categoryMeta = MERCHANT_CATEGORIES.find((x) => x.key === merchant.category);
  const tierMeta = MERCHANT_TIERS.find((x) => x.key === merchant.tier);
  const isChain = merchant.tier === "chain";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/posts?type=promo" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-accent">
        <ChevronLeft className="h-4 w-4" />返回推广帖
      </Link>

      <div className="card space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={"inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm font-semibold " + (isChain ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                <Store className="h-4 w-4" />
                {merchant.name}
              </span>
              <span className={"rounded px-1.5 py-0.5 text-[11px] font-medium " + (isChain ? "bg-amber-600 text-white" : "bg-emerald-600 text-white")}>
                {tierMeta?.label ?? merchant.tier}
              </span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">
                {categoryMeta?.label ?? merchant.category}
              </span>
              {merchant.claimStatus === "claimed" && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                  <BadgeCheck className="h-3 w-3" />已认领
                </span>
              )}
            </div>
            {(merchant.school || merchant.city || merchant.address) && (
              <p className="mt-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                {merchant.school && <span>{merchant.school.name}</span>}
                {merchant.city && <span>{merchant.city}</span>}
                {merchant.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{merchant.address}
                  </span>
                )}
              </p>
            )}
          </div>
          <Link href={"/posts/new?type=promo&merchant=" + merchant.id} className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" />为该商户发推广帖
          </Link>
        </div>

        {merchant.description && <p className="text-sm leading-relaxed text-zinc-600">{merchant.description}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-zinc-400">
          <span>{sorted.length} 条关联内容</span>
          {owner && <span>入驻主理人：{owner.nickname}</span>}
          {merchant.claimStatus === "unclaimed" && <span>商户尚未认领，认领功能即将开放</span>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-ink">相关帖子</h2>
          <span className="text-xs text-zinc-400">含明示推广与未来学生自发种草</span>
        </div>
        {sorted.length === 0 ? (
          <div className="card p-10 text-center text-sm text-zinc-400">还没有关联帖子，成为第一个推荐这家的人</div>
        ) : (
          sorted.map((post) => (
            <ExperiencePostCard
              key={post.id}
              id={post.id}
              title={post.title}
              content={post.content}
              postType={post.postType}
              merchantName={post.merchantName}
              merchant={{ id: merchant.id, name: merchant.name, tier: merchant.tier, category: merchant.category }}
              images={JSON.parse(post.images) as string[]}
              likeCount={post.likeCount}
              favoriteCount={post.favoriteCount}
              status={post.status}
              createdAt={post.createdAt}
              fromReply={Boolean(post.sourceReplyId)}
              school={post.school}
              major={post.major}
              author={{ nickname: post.author.nickname, verifiedSchools: post.author.verifiedSchools, level: post.author.level }}
            />
          ))
        )}
      </div>
    </div>
  );
}
