import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, MapPin, Plus, Star, Store } from "lucide-react";
import { useDb, act } from "../store";
import * as db from "../db";
import { ExperiencePostCard, VerifiedBadge } from "../components";

function Stars({ value, size = "h-4 w-4" }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star key={v} className={`${size} ${v <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
      ))}
    </span>
  );
}

export default function Merchant() {
  const state = useDb();
  const { id } = useParams();
  const navigate = useNavigate();
  const user = db.getCurrentUser(state);
  const data = db.getMerchant(state, id);

  const [rating, setRating] = useState(0);
  const [dimValues, setDimValues] = useState({});
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [syncToPost, setSyncToPost] = useState(false);
  const [syncPostType, setSyncPostType] = useState("experience");
  const [formError, setFormError] = useState("");
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [claimError, setClaimError] = useState("");

  if (!data) {
    return <div className="card p-10 text-center text-sm text-zinc-400">商户不存在或已下架。<Link to="/posts?type=promo" className="text-accent hover:underline">返回推广帖</Link></div>;
  }
  const { merchant, posts, reviews, myReview, canReply, dimDefs, stats } = data;
  const cat = db.MERCHANT_CATEGORIES.find((x) => x.key === merchant.category);
  const tier = db.MERCHANT_TIERS.find((x) => x.key === merchant.tier);
  const isChain = merchant.tier === "chain";
  const school = state.schools.find((s) => s.id === merchant.schoolId) ?? null;
  const owner = state.users.find((u) => u.id === merchant.ownerId) ?? null;
  const canReview = Boolean(user) && !myReview;

  function submitReview(e) {
    e.preventDefault();
    setFormError("");
    try {
      const created = act(db.createMerchantReview, merchant.id, { rating, dims: dimValues, content, isAnonymous, syncToPost, postType: syncPostType });
      setRating(0);
      setDimValues({});
      setContent("");
      setIsAnonymous(false);
      setSyncToPost(false);
      if (created && created.postId) navigate(`/posts/${created.postId}`);
    } catch (err) {
      setFormError(err.message);
    }
  }

  function submitReply(e, reviewId) {
    e.preventDefault();
    setReplyError("");
    try {
      act(db.replyMerchantReview, merchant.id, reviewId, replyText);
      setReplyOpen(null);
      setReplyText("");
    } catch (err) {
      setReplyError(err.message);
    }
  }

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
          <span>{posts.length} 条关联帖子</span>
          <span>{stats.reviewCount} 条评价</span>
          {owner && <span>主理人：{owner.nickname}</span>}
          {merchant.claimStatus === "unclaimed" && user && (
            <span>
              <button
                type="button"
                onClick={() => {
                  setClaimError("");
                  try { act(db.claimMerchant, merchant.id); } catch (err) { setClaimError(err.message); }
                }}
                className="rounded-md border border-line px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                我是店主，认领这家店
              </button>
              {claimError && <span className="ml-2 text-red-500">{claimError}</span>}
            </span>
          )}
          {merchant.claimStatus === "unclaimed" && !user && <span>商户尚未认领，登录后可认领</span>}
        </div>
      </div>

      <div className="card space-y-4 p-6">
        {stats.insufficient ? (
          <div className="text-sm text-zinc-500">
            <p className="font-medium text-ink">暂未显示评分</p>
            <p className="mt-1 text-xs text-zinc-400">有效评价数不足 {db.MERCHANT_MIN_REVIEWS} 条（当前 {stats.scoredCount} 条），为避免小样本误导暂不展示星级。</p>
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

      {canReview && (
        <form onSubmit={submitReview} className="card space-y-4 p-5">
          <h3 className="text-sm font-semibold text-ink">写评价（真实消费 / 使用后分享）</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-500">总评</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} type="button" onClick={() => setRating(v)} title={`${v} 星`}>
                  <Star className={`h-5 w-5 ${v <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
                </button>
              ))}
            </div>
          </div>
          {dimDefs.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {dimDefs.map((d) => (
                <div key={d.key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">{d.label}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button key={v} type="button" onClick={() => setDimValues((prev) => ({ ...prev, [d.key]: v }))}>
                        <Star className={`h-4 w-4 ${v <= (dimValues[d.key] ?? 0) ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <textarea className="input min-h-24" value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} placeholder="说说你的真实体验：好在哪、坑在哪、适合什么场景……" required />
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
            匿名展示（昵称与认证信息对其他人隐藏，保护差评）
          </label>
          <div className="rounded-md border border-line p-3">
            <label className="flex items-center gap-2 text-xs text-zinc-600">
              <input type="checkbox" checked={syncToPost} onChange={(e) => setSyncToPost(e.target.checked)} />
              同时发布为帖子（进入经验帖池，可被点赞/收藏并计入创作者激励）
            </label>
            {syncToPost && (
              <div className="mt-2 flex items-center gap-2 pl-6 text-xs text-zinc-500">
                类型：
                <select className="input h-8 w-28 py-0" value={syncPostType} onChange={(e) => setSyncPostType(e.target.value)}>
                  <option value="experience">经验帖</option>
                  <option value="avoid">避雷帖</option>
                </select>
              </div>
            )}
          </div>
          {formError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">发布评价</button>
          </div>
        </form>
      )}
      {!user && (
        <div className="card p-4 text-sm text-zinc-500"><Link to="/login" className="text-accent hover:underline">登录</Link> 后可写下你的真实体验。</div>
      )}
      {myReview && <div className="card p-4 text-sm text-zinc-500">你已评价过这家商户，感谢分享。</div>}

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
                <span className="text-sm font-medium text-zinc-700">{r.isAnonymous ? "匿名用户" : r.author?.nickname ?? "用户"}</span>
                {!r.isAnonymous && r.author && <VerifiedBadge schools={JSON.parse(r.author.verifiedSchools || "[]")} />}
                <span className="ml-auto text-xs text-zinc-400">{db.formatRelative(r.createdAt)}</span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-700">{r.content}</p>
              {dimDefs.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
                  {dimDefs.map((d) => (typeof r.dims[d.key] === "number" ? <span key={d.key}>{d.label} {r.dims[d.key]}</span> : null))}
                </div>
              )}
              {r.isPromoter && <p className="text-xs text-amber-600">该用户曾为这家商户发过推广帖，其评价不计入评分。</p>}
              {r.isNewbie && <p className="text-xs text-zinc-400">该账号注册不足 3 天，评价已展示但暂不计入评分。</p>}
              {r.sourcePostId && <Link to={`/posts/${r.sourcePostId}`} className="text-xs text-accent hover:underline">已同步为帖子，查看 →</Link>}
              {r.merchantReply && (
                <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">
                  <p className="mb-1 text-xs font-medium text-zinc-500">商户回复</p>
                  {r.merchantReply}
                </div>
              )}
              {canReply && (
                replyOpen === r.id ? (
                  <form onSubmit={(e) => submitReply(e, r.id)} className="space-y-2">
                    <textarea className="input min-h-16" value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={500} placeholder="以商户身份回应（差评也建议回应）" required />
                    {replyError && <p className="text-xs text-red-500">{replyError}</p>}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setReplyOpen(null)} className="btn-ghost">取消</button>
                      <button type="submit" className="btn-primary">提交回复</button>
                    </div>
                  </form>
                ) : (
                  <button type="button" onClick={() => setReplyOpen(r.id)} className="text-xs text-accent hover:underline">回复这条评价</button>
                )
              )}
            </div>
          ))
        )}
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
