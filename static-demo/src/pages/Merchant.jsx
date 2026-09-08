import { Link, useParams } from "react-router-dom";
import { BadgeCheck, MapPin, Plus, Store } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { ExperiencePostCard } from "../components";

export default function Merchant() {
  const state = useDb();
  const { id } = useParams();
  const data = db.getMerchant(state, id);

  if (!data) {
    return <div className="card p-10 text-center text-sm text-zinc-400">商户不存在或已下架。<Link to="/posts?type=promo" className="text-accent hover:underline">返回推广帖</Link></div>;
  }
  const { merchant, posts } = data;
  const cat = db.MERCHANT_CATEGORIES.find((x) => x.key === merchant.category);
  const tier = db.MERCHANT_TIERS.find((x) => x.key === merchant.tier);
  const isChain = merchant.tier === "chain";
  const school = state.schools.find((s) => s.id === merchant.schoolId) ?? null;
  const user = db.getCurrentUser(state);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/posts?type=promo" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-accent">← 返回推广帖</Link>

      <div className="card space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm font-semibold ${isChain ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                <Store className="h-4 w-4" />
                {merchant.name}
              </span>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${isChain ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"}`}>{tier?.label ?? merchant.tier}</span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">{cat?.label ?? merchant.category}</span>
              {merchant.claimStatus === "claimed" && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-accent"><BadgeCheck className="h-3 w-3" />已认领</span>
              )}
            </div>
            {(school || merchant.city || merchant.address) && (
              <p className="mt-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                {school && <span>{school.name}</span>}
                {merchant.city && <span>{merchant.city}</span>}
                {merchant.address && (<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{merchant.address}</span>)}
              </p>
            )}
          </div>
          {user && (
            <Link to="/posts/new" className="btn-primary whitespace-nowrap"><Plus className="h-4 w-4" />为该商户发推广帖</Link>
          )}
        </div>

        {merchant.description && <p className="text-sm leading-relaxed text-zinc-600">{merchant.description}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-zinc-400">
          <span>{posts.length} 条关联内容</span>
          {merchant.claimStatus === "unclaimed" && <span>商户尚未认领，认领功能即将开放</span>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-ink">相关帖子</h2>
          <span className="text-xs text-zinc-400">含明示推广与未来学生自发种草</span>
        </div>
        {posts.length === 0 ? (
          <div className="card p-10 text-center text-sm text-zinc-400">还没有关联帖子，成为第一个推荐这家的人</div>
        ) : (
          posts.map((post) => <ExperiencePostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
