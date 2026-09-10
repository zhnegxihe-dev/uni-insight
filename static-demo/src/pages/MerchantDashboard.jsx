import { Link, useParams } from "react-router-dom";
import { Crown, TrendingUp, Users } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { LeadStatusActions } from "../components";

function yuan(cents) { return "¥" + (cents / 100).toFixed(2); }

export default function MerchantDashboard() {
  const state = useDb();
  const { id } = useParams();
  const user = db.getCurrentUser(state);
  const data = db.getMerchantDashboard(state, id);

  if (!data) return <div className="card p-10 text-center text-sm text-zinc-400">商户不存在</div>;
  const { merchant, leads, commissions, stats } = data;
  const allowed = user && (merchant.ownerId === user.id || (user.role || "user") === "admin");
  if (!allowed) return <div className="card p-10 text-center text-sm text-zinc-400">只有商户主理人可访问该后台{!user && <> · <Link to="/login" className="text-accent hover:underline">去登录</Link></>}</div>;
  const plan = db.MERCHANT_PLANS.find((p) => p.key === merchant.plan);
  const authorName = (uid) => state.users.find((u) => u.id === uid)?.nickname ?? "—";

  const stat = (label, value, hint) => (
    <div key={label} className="card p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to={`/merchant/${merchant.id}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-accent">← 返回商户主页</Link>
      <div className="card flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{merchant.name} · 商户后台</h1>
          <p className="mt-1 text-sm text-zinc-500">线索管理 · 成交结算 · 佣金对账 · 内容与口碑概览</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"><Crown className="h-3.5 w-3.5" />{plan?.label ?? merchant.plan}</span>
          <div className="mt-1"><Link to={`/merchant/${merchant.id}/upgrade`} className="text-xs text-accent hover:underline">管理 / 升级套餐 →</Link></div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stat("线索总数", String(stats.leadCount))}
        {stat("新线索", String(stats.newCount))}
        {stat("成交数", String(stats.dealCount))}
        {stat("成交额", yuan(stats.revenue))}
        {stat("平台佣金", yuan(stats.platformFee), "成交额的 10%")}
        {stat("推广者分成", yuan(stats.promoterFee), "成交额的 5%")}
      </div>
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-accent" /><h2 className="text-base font-semibold text-ink">咨询线索</h2></div>
        {leads.length === 0 ? <p className="text-sm text-zinc-400">还没有线索。分享商户主页或发推广帖，让更多学生找到你。</p> : (
          <div className="space-y-3">
            {leads.map((l) => (
              <div key={l.id} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span>{db.formatRelative(l.createdAt)}</span>
                  {l.sourcePostAuthorId && <span>来自推广者：{authorName(l.sourcePostAuthorId)}</span>}
                  {!l.sourcePostAuthorId && <span>来自商户主页</span>}
                  <span className="ml-auto">{l.status === "new" ? "待跟进" : l.status === "contacted" ? "已联系" : l.status === "deal" ? "已成交" : "已取消"}</span>
                </div>
                {l.message && <p className="mt-2 text-sm text-zinc-700">{l.message}</p>}
                {l.contact && <p className="mt-1 text-xs text-zinc-500">联系方式：{l.contact}</p>}
                {l.dealAmount ? <p className="mt-1 text-xs text-emerald-600">成交额：{yuan(l.dealAmount)}</p> : null}
                <div className="mt-2"><LeadStatusActions merchantId={merchant.id} leadId={l.id} status={l.status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /><h2 className="text-base font-semibold text-ink">佣金与分成记录</h2></div>
        {commissions.length === 0 ? <p className="text-sm text-zinc-400">暂无成交结算记录</p> : (
          <div className="space-y-2">
            {commissions.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2 text-xs text-zinc-600">
                <span className={"rounded px-1.5 py-0.5 font-medium " + (c.kind === "platform" ? "bg-blue-50 text-accent" : "bg-emerald-50 text-emerald-600")}>{c.kind === "platform" ? "平台佣金" : "推广者分成"}</span>
                <span>成交基数 {yuan(c.baseAmount)}</span>
                <span>费率 {(c.rate * 100).toFixed(0)}%</span>
                <span className="ml-auto font-medium text-ink">{yuan(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
