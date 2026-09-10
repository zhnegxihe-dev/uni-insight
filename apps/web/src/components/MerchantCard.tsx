import Link from "next/link";
import { BadgeCheck, MapPin, Star, Store } from "lucide-react";
import { MERCHANT_CATEGORIES, MERCHANT_TIERS } from "@/lib/core";

interface MerchantCardProps {
  merchant: {
    id: string;
    name: string;
    category: string;
    tier: string;
    claimStatus: string;
    city: string | null;
    address: string | null;
    description?: string | null;
    school?: { name: string; slug: string } | null;
  };
  rating: { rating: number; scoredCount: number; reviewCount: number; insufficient: boolean };
  postCount: number;
}

export function MerchantCard({ merchant, rating, postCount }: MerchantCardProps) {
  const cat = MERCHANT_CATEGORIES.find((x) => x.key === merchant.category);
  const tier = MERCHANT_TIERS.find((x) => x.key === merchant.tier);
  const isChain = merchant.tier === "chain";
  return (
    <Link href={`/merchant/${merchant.id}`} className="card block p-5 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
              <Store className="h-4 w-4 shrink-0 text-zinc-400" />
              {merchant.name}
            </span>
            {merchant.claimStatus === "claimed" && <BadgeCheck className="h-3.5 w-3.5 text-accent" />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={"rounded px-1.5 py-0.5 text-[11px] font-medium " + (isChain ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
              {tier?.label ?? merchant.tier}
            </span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">{cat?.label ?? merchant.category}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {rating.insufficient ? (
            <span className="text-xs text-zinc-400">评价不足<br />暂无评分</span>
          ) : (
            <>
              <span className="text-lg font-semibold text-ink">{rating.rating.toFixed(1)}</span>
              <span className="ml-1 inline-flex items-center gap-0.5 align-middle">
                {[1, 2, 3, 4, 5].map((v) => (
                  <Star key={v} className={"h-3 w-3 " + (v <= Math.round(rating.rating) ? "fill-amber-400 text-amber-400" : "text-zinc-300")} />
                ))}
              </span>
              <span className="block text-[11px] text-zinc-400">{rating.scoredCount} 条有效评价</span>
            </>
          )}
        </div>
      </div>

      {(merchant.school || merchant.city || merchant.address) && (
        <p className="mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          {merchant.school && <span>{merchant.school.name}</span>}
          {merchant.city && <span>{merchant.city}</span>}
          {merchant.address && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{merchant.address}</span>
          )}
        </p>
      )}

      {merchant.description && (
        <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{merchant.description}</p>
      )}
      <div className="mt-3 flex items-center gap-3 border-t border-line pt-3 text-xs text-zinc-400">
        <span>{postCount} 条帖子</span>
        <span>{rating.reviewCount} 条评价</span>
      </div>
    </Link>
  );
}
