import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Crown, TrendingUp, Users } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MERCHANT_PLANS } from "@/lib/core";
import { loadMerchantDetail } from "@/lib/merchant";
import { LeadStatusActions } from "@/components/LeadStatusActions";
import { formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

function yuan(cents: number) {
  return "¥" + (cents / 100).toFixed(2);
}

export default async function MerchantDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="card mx-auto max-w-3xl p-10 text-center text-sm text-zinc-500">
        <Link href="/login" className="text-accent hover:underline">登录</Link> 后查看商户后台
      </div>
    );
  }
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    select: { id: true, name: true, ownerId: true, plan: true, planExpiresAt: true },
  });
  if (!merchant) notFound();
  if (merchant.ownerId !== user.id && user.role !== "admin") {
    return <div className="card mx-auto max-w-3xl p-10 text-center text-sm text-zinc-500">只有商户主理人可访问该后台</div>;
  }
  const [leads, commissions, detail] = await Promise.all([
    prisma.merchantLead.findMany({ where: { merchantId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.merchantCommission.findMany({ where: { merchantId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    loadMerchantDetail(id, user.id),
  ]);
  const sourceAuthorIds = Array.from(new Set(leads.map((l) => l.sourcePostAuthorId).filter((x): x is string => Boolean(x))));
  const sourceAuthors = sourceAuthorIds.length
    ? await prisma.user.findMany({ where: { id: { in: sourceAuthorIds } }, select: { id: true, nickname: true } })
    : [];
  const authorName = (uid: string | null) => sourceAuthors.find((a) => a.id === uid)?.nickname ?? "—";
  const deals = leads.filter((l) => l.status === "deal");
  const revenue = deals.reduce((s, l) => s + (l.dealAmount ?? 0), 0);
  const platformFee = commissions.filter((c) => c.kind === "platform").reduce((s, c) => s + c.amount, 0);
  const promoterFee = commissions.filter((c) => c.kind === "promoter").reduce((s, c) => s + c.amount, 0);
  const planMeta = MERCHANT_PLANS.find((p) => p.key === merchant.plan);

  const stat = (label: string, value: string, hint?: string) => (
    <div key={label} className="card p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/merchant/${merchant.id}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-accent">
        <ChevronLeft className="h-4 w-4" />返回商户主页
      </Link>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{merchant.name} · 商户后台</h1>
          <p className="mt-1 text-sm text-zinc-500">线索管理 · 成交结算 · 佣金对账 · 内容与口碑概览</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
            <Crown className="h-3.5 w-3.5" />
            {planMeta?.label ?? merchant.plan}
          </span>
          <div className="mt-1">
            <Link href={`/merchant/${merchant.id}/upgrade`} className="text-xs text-accent hover:underline">管理 / 升级套餐 →</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stat("线索总数", String(leads.length))}
        {stat("新线索", String(leads.filter((l) => l.status === "new").length))}
        {stat("成交数", String(deals.length))}
        {stat("成交额", yuan(revenue))}
        {stat("平台佣金", yuan(platformFee), "成交额的 10%")}
        {stat("推广者分成", yuan(promoterFee), "成交额的 5%")}
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <h2 className="text-base font-semibold text-ink">咨询线索</h2>
          <span className="text-xs text-zinc-400">来自商户主页与推广帖的咨询</span>
        </div>
        {leads.length === 0 ? (
          <p className="text-sm text-zinc-400">还没有线索。分享商户主页或发推广帖，让更多学生找到你。</p>
        ) : (
          <div className="space-y-3">
            {leads.map((l) => (
              <div key={l.id} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span>{formatRelative(l.createdAt)}</span>
                  {l.sourcePostAuthorId && <span>来自推广者：{authorName(l.sourcePostAuthorId)}</span>}
                  {!l.sourcePostAuthorId && <span>来自商户主页</span>}
                  <span className="ml-auto">
                    {l.status === "new" ? "待跟进" : l.status === "contacted" ? "已联系" : l.status === "deal" ? "已成交" : "已取消"}
                  </span>
                </div>
                {l.message && <p className="mt-2 text-sm text-zinc-700">{l.message}</p>}
                {l.contact && <p className="mt-1 text-xs text-zinc-500">联系方式：{l.contact}</p>}
                {l.dealAmount ? <p className="mt-1 text-xs text-emerald-600">成交额：{yuan(l.dealAmount)}</p> : null}
                <div className="mt-2">
                  <LeadStatusActions merchantId={merchant.id} leadId={l.id} status={l.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h2 className="text-base font-semibold text-ink">佣金与分成记录</h2>
        </div>
        {commissions.length === 0 ? (
          <p className="text-sm text-zinc-400">暂无成交结算记录</p>
        ) : (
          <div className="space-y-2">
            {commissions.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2 text-xs text-zinc-600">
                <span className={"rounded px-1.5 py-0.5 font-medium " + (c.kind === "platform" ? "bg-blue-50 text-accent" : "bg-emerald-50 text-emerald-600")}>
                  {c.kind === "platform" ? "平台佣金" : "推广者分成"}
                </span>
                <span>成交基数 {yuan(c.baseAmount)}</span>
                <span>费率 {(c.rate * 100).toFixed(0)}%</span>
                <span className="ml-auto font-medium text-ink">{yuan(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stat("关联帖子", String(detail?.posts.length ?? 0))}
        {stat("评价数", String(detail?.stats.reviewCount ?? 0))}
        {stat("有效评分", detail && !detail.stats.insufficient ? detail.stats.rating.toFixed(1) : "评价不足")}
      </div>
    </div>
  );
}
