import Link from "next/link";
import { Scale } from "lucide-react";
import { OUTCOME_LABELS, REVIEW_DIMENSIONS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { aggregateOutcomes, averageRatings } from "@/lib/reviews";
import { RadarChart } from "@/components/RadarChart";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ school1?: string; school2?: string; major?: string }>;
}) {
  const params = await searchParams;
  const school1Slug = params.school1 ?? "";
  const school2Slug = params.school2 ?? "";
  const majorSlug = params.major ?? "";

  const [schools, majors, school1, school2, major] = await Promise.all([
    prisma.school.findMany({ select: { id: true, name: true, slug: true, region: true, type: true }, orderBy: { name: "asc" } }),
    prisma.major.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    school1Slug
      ? prisma.school.findUnique({
          where: { slug: school1Slug },
          include: {
            reviews: {
              include: { author: { select: { nickname: true, verifiedSchools: true } } },
            },
          },
        })
      : null,
    school2Slug
      ? prisma.school.findUnique({
          where: { slug: school2Slug },
          include: {
            reviews: {
              include: { author: { select: { nickname: true, verifiedSchools: true } } },
            },
          },
        })
      : null,
    majorSlug ? prisma.major.findUnique({ where: { slug: majorSlug } }) : null,
  ]);

  function reviewsForSchool(school: { reviews: { courseId: string | null; teacherId: string | null; majorId: string | null; ratings: string }[] } | null) {
    if (!school) return [];
    return school.reviews.filter(
      (review) => !review.courseId && !review.teacherId && (!major || review.majorId === major.id)
    );
  }

  const school1Reviews = reviewsForSchool(school1);
  const school2Reviews = reviewsForSchool(school2);
  const dims = REVIEW_DIMENSIONS.school;
  const leftRows = school1 ? averageRatings(school1Reviews, dims) : [];
  const rightRows = school2 ? averageRatings(school2Reviews, dims) : [];
  const hasLeft = school1Reviews.length > 0;
  const hasRight = school2Reviews.length > 0;
  const series = [
    { label: school1?.name ?? "学校 A", color: "#2563eb", values: leftRows.map((row) => row.avg ?? 0) },
    { label: school2?.name ?? "学校 B", color: "#f59e0b", values: rightRows.map((row) => row.avg ?? 0) },
  ].filter((item) => item.values.some((value) => value > 0));
  const leftOutcomes = school1 ? aggregateOutcomes(school1Reviews) : null;
  const rightOutcomes = school2 ? aggregateOutcomes(school2Reviews) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Scale className="h-5 w-5 text-accent" />
          <div>
            <h1 className="text-xl font-semibold text-ink">学校对比</h1>
            <p className="mt-0.5 text-sm text-zinc-500">基于结构化评价的均值，不实时调用 AI，适合快速横向比较。</p>
          </div>
        </div>

        <form method="get" action="/compare" className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <select name="school1" className="input" defaultValue={school1Slug}>
            <option value="">选择学校 A</option>
            {schools.map((school) => (
              <option key={school.id} value={school.slug}>{school.name}</option>
            ))}
          </select>
          <select name="school2" className="input" defaultValue={school2Slug}>
            <option value="">选择学校 B</option>
            {schools.map((school) => (
              <option key={school.id} value={school.slug}>{school.name}</option>
            ))}
          </select>
          <select name="major" className="input" defaultValue={majorSlug}>
            <option value="">全部专业</option>
            {majors.map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">开始对比</button>
        </form>
      </section>

      {school1 && school2 && school1.id === school2.id && (
        <p className="card p-4 text-center text-sm text-amber-700">请选择两所不同的学校进行对比。</p>
      )}

      {school1 && school2 && school1.id !== school2.id && (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {[school1, school2].map((school) => {
              const rows = school.id === school1.id ? leftRows : rightRows;
              const hasData = (school.id === school1.id ? hasLeft : hasRight);
              const outcomes = school.id === school1.id ? leftOutcomes : rightOutcomes;
              return (
                <section key={school.id} className="card p-5">
                  <div className="mb-1 text-xs text-zinc-500">{school.region || "地区未知"} · {school.type || "高校"}</div>
                  <h2 className="text-lg font-semibold text-ink">{school.name}</h2>
                  {major && <p className="mt-1 text-xs text-zinc-400">对比专业：{major.name}</p>}
                  <div className="mt-4 space-y-3">
                    {!hasData ? (
                      <p className="text-sm text-zinc-400">暂无足够评价样本</p>
                    ) : (
                      rows.map((row) => (
                        <div key={row.key} className="flex items-center gap-2 text-sm">
                          <span className="w-16 shrink-0 text-zinc-500">{row.label}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${((row.avg ?? 0) / 5) * 100}%` }} />
                          </div>
                          <span className="w-10 shrink-0 text-right font-medium text-ink">{row.avg ?? "—"}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {outcomes && (
                    <div className="mt-4 border-t border-line pt-3">
                      <h3 className="mb-2 text-xs font-medium text-zinc-500">毕业去向（均值）</h3>
                      <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100">
                        {Object.entries(outcomes).map(([key, value], index) => (
                          <div key={key} className="h-full bg-accent" style={{ width: `${value}%`, opacity: 1 - index * 0.2 }} />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                        {Object.entries(outcomes).map(([key, value]) => (
                          <span key={key}>{OUTCOME_LABELS[key] ?? key} {value}%</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link href={`/school/${school.slug}`} className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
                    查看 {school.name} 档案
                  </Link>
                </section>
              );
            })}
          </div>

          <section className="card p-5">
            <h2 className="mb-4 text-base font-semibold text-ink">雷达图对比</h2>
            <RadarChart
              labels={dims.map((dim) => dim.label)}
              series={series}
            />
            {(hasLeft || hasRight) && (
              <p className="mt-3 text-center text-xs text-zinc-400">
                雷达图只展示有评价样本的维度；样本不足时请谨慎参考。
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
