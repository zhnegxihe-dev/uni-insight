import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MERCHANT_CATEGORIES } from "@/lib/core";
import { loadMerchantRatings } from "@/lib/merchant";
import { MerchantCard } from "@/components/MerchantCard";
import { cn } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "campus", label: "校园周边", hint: "校门口与大学城的好去处" },
  { key: "city", label: "城市周末", hint: "小众景区与休闲去处" },
  { key: "promo", label: "推广热榜", hint: "明示标注的商家推广" },
] as const;

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; school?: string; city?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as string) : "campus";
  const schoolId = sp.school ?? "";
  const city = sp.city ?? "";
  const category = sp.category && MERCHANT_CATEGORIES.some((c) => c.key === sp.category) ? sp.category : "";

  const where: Prisma.MerchantWhereInput = { status: "active" };
  if (tab === "campus") where.schoolId = schoolId ? schoolId : { not: null };
  else if (tab === "city") where.city = city ? city : { not: null };
  else where.posts = { some: { postType: "promo", status: { not: "hidden" } } };
  if (category) where.category = category;

  const [merchants, schools, cityRows] = await Promise.all([
    prisma.merchant.findMany({
      where,
      include: {
        school: { select: { name: true, slug: true } },
        _count: { select: { posts: { where: { status: { not: "hidden" } } } } },
      },
      take: 60,
    }),
    prisma.school.findMany({ where: { merchants: { some: { status: "active" } } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.merchant.findMany({ where: { status: "active", city: { not: null } }, select: { city: true }, distinct: ["city"], orderBy: { city: "asc" } }),
  ]);
  const ratings = await loadMerchantRatings(merchants.map((m) => m.id));
  const sorted = tab === "promo" ? [...merchants].sort((a, b) => b._count.posts - a._count.posts) : merchants;

  const chip = (href: string, active: boolean, label: string) => (
    <Link
      key={href + label}
      href={href}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs transition",
        active ? "bg-accent text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">校园生活 · 发现好去处</h1>
        <p className="mt-1 text-sm text-zinc-500">学生视角的吃玩逛推荐：校园周边的小店、城市周末的小众去处，以及明示标注的商家推广。</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/places?tab=${t.key}`}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition",
              tab === t.key
                ? "border-accent bg-blue-50 text-accent"
                : "border-line text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <span className="block font-medium">{t.label}</span>
            <span className="mt-0.5 block text-[11px] text-zinc-400">{t.hint}</span>
          </Link>
        ))}
      </div>

      {tab === "campus" && (
        <div className="flex flex-wrap gap-2">
          {chip("/places?tab=campus", !schoolId, "全部学校")}
          {schools.map((s) => chip(`/places?tab=campus&school=${s.id}${category ? `&category=${category}` : ""}`, schoolId === s.id, s.name))}
        </div>
      )}
      {tab === "city" && (
        <div className="flex flex-wrap gap-2">
          {chip("/places?tab=city", !city, "全部城市")}
          {cityRows.map((c) => c.city && chip(`/places?tab=city&city=${encodeURIComponent(c.city)}${category ? `&category=${category}` : ""}`, city === c.city, c.city))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {chip(`${tab === "campus" && schoolId ? `/places?tab=campus&school=${schoolId}` : tab === "city" && city ? `/places?tab=city&city=${encodeURIComponent(city)}` : `/places?tab=${tab}`}`, !category, "全部分类")}
        {MERCHANT_CATEGORIES.map((c) =>
          chip(
            `/places?tab=${tab}${schoolId && tab === "campus" ? `&school=${schoolId}` : ""}${city && tab === "city" ? `&city=${encodeURIComponent(city)}` : ""}&category=${c.key}`,
            category === c.key,
            c.label
          )
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-400">这里还没有收录的商户，去发一条推广帖把它带进来吧</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((m) => (
            <MerchantCard
              key={m.id}
              merchant={m}
              rating={ratings.get(m.id) ?? { rating: 0, scoredCount: 0, reviewCount: 0, insufficient: true }}
              postCount={m._count.posts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
