import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronLeft, MapPin, Plus, Star, Store } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { loadMerchantDetail } from "@/lib/merchant";
import { MERCHANT_CATEGORIES, MERCHANT_TIERS, MERCHANT_MIN_REVIEWS } from "@/lib/core";
import { formatRelative } from "@/lib/format";
import { ExperiencePostCard } from "@/components/ExperiencePostCard";
import { MerchantReviewForm } from "@/components/MerchantReviewForm";
import { MerchantClaimButton } from "@/components/MerchantClaimButton";
import { MerchantReviewReply } from "@/components/MerchantReviewReply";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const dynamic = "force-dynamic";

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          className={
            "fill-amber-400 text-amber-400 " +
            size +
            (v <= Math.round(value) ? "" : " opacity-25")
          }
        />
      ))}
    </span>
  );
}

export default async function MerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const detail = await loadMerchantDetail(id, user?.id ?? null);
  if (!detail) notFound();
  const { merchant, owner, posts, reviews, myReview, canReply, dimDefs, stats } = detail;

  const categoryMeta = MERCHANT_CATEGORIES.find((x) => x.key === merchant.category);
  const tierMeta = MERCHANT_TIERS.find((x) => x.key === merchant.tier);
  const isChain = merchant.tier === "chain";
  const canReview = Boolean(user) && !myReview;

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
          <span>{posts.length} 条关联帖子</span>
          <span>{stats.reviewCount} 条评价</span>
          {owner && <span>主理人：{owner.nickname}</span>}
          {merchant.claimStatus === "unclaimed" && user && <MerchantClaimButton merchantId={merchant.id} />}
          {merchant.claimStatus === "unclaimed" && !user && <span>商户尚未认领，登录后可认领</span>}
        </div>
      </div>

      {/* 评分 */}
      <div className="card space-y-4 p-6">
        {stats.insufficient ? (
          <div className="text-sm text-zinc-500">
            <p className="font-medium text-ink">暂未显示评分</p>
            <p className="mt-1 text-xs text-zinc-400">
              有效评价数不足 {MERCHANT_MIN_REVIEWS} 条（当前 {stats.scoredCount} 条），为避免小样本误导暂不展示星级。
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-3xl font-semibold text-ink">{stats.rating.toFixed(1)}</div>
              <Stars value={stats.rating} />
              <div className="mt-1 text-xs text-zinc-400">{stats.scoredCount} 条有效评价</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {stats.dims.map((d) => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-zinc-500">{d.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${(d.value / 5) * 100}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-zinc-500">{d.value || "-"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {stats.promoterExcluded > 0 && (
          <p className="text-xs text-zinc-400">另有 {stats.promoterExcluded} 条来自该商户推广者的评价已展示但不计入评分（避免既当运动员又当裁判）。</p>
        )}
      </div>

      {/* 评价表单 */}
      {canReview && <MerchantReviewForm merchantId={merchant.id} dims={dimDefs} />}
      {!user && (
        <div className="card p-4 text-sm text-zinc-500">
          <Link href="/login" className="text-accent hover:underline">登录</Link> 后可写下你的真实体验。
        </div>
      )}
      {myReview && (
        <div className="card p-4 text-sm text-zinc-500">你已评价过这家商户，感谢分享。</div>
      )}

      {/* 评价列表 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-ink">用户评价</h2>
          <span className="text-xs text-zinc-400">真实消费 / 使用后分享，商户可回复</span>
        </div>
        {reviews.length === 0 ? (
          <div className="card p-8 text-center text-sm text-zinc-400">还没有评价，来写下第一条真实体验</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="card space-y-2 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={r.rating} />
                <span className="text-sm font-medium text-zinc-700">
                  {r.isAnonymous ? "匿名用户" : r.author?.nickname ?? "用户"}
                </span>
                {!r.isAnonymous && r.author && (
                  <VerifiedBadge schools={JSON.parse(r.author.verifiedSchools || "[]") as string[]} />
                )}
                <span className="ml-auto text-xs text-zinc-400">{formatRelative(r.createdAt)}</span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-700">{r.content}</p>
              {dimDefs.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
                  {dimDefs.map((d) =>
                    typeof r.dims[d.key] === "number" ? (
                      <span key={d.key}>{d.label} {r.dims[d.key]}</span>
                    ) : null
                  )}
                </div>
              )}
              {r.isPromoter && (
                <p className="text-xs text-amber-600">该用户曾为这家商户发过推广帖，其评价不计入评分。</p>
              )}
              {r.merchantReply && (
                <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">
                  <p className="mb-1 text-xs font-medium text-zinc-500">商户回复</p>
                  {r.merchantReply}
                </div>
              )}
              {canReply && <MerchantReviewReply merchantId={merchant.id} reviewId={r.id} />}
            </div>
          ))
        )}
      </div>

      {/* 相关帖子 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-ink">相关帖子</h2>
          <span className="text-xs text-zinc-400">含明示推广与未来学生自发种草</span>
        </div>
        {posts.length === 0 ? (
          <div className="card p-10 text-center text-sm text-zinc-400">还没有关联帖子，成为第一个推荐这家的人</div>
        ) : (
          posts.map((post) => (
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
