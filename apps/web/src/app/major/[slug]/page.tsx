import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Building2, MessageSquare } from "lucide-react";
import { OUTCOME_LABELS, REVIEW_DIMENSIONS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { aggregateOutcomes, averageRatings } from "@/lib/reviews";
import { QuestionCard } from "@/components/QuestionCard";
import { RatingBars } from "@/components/RatingBars";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewSummaryCard } from "@/components/ReviewSummaryCard";

export const dynamic = "force-dynamic";

export default async function MajorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const major = await prisma.major.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { courseId: null, teacherId: null },
        include: {
          school: { select: { id: true, name: true, slug: true } },
          author: { select: { nickname: true, verifiedSchools: true } },
        },
      },
      courses: {
        include: {
          school: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
  if (!major) notFound();

  const [user, questions] = await Promise.all([
    getSessionUser(),
    prisma.question.findMany({
      where: { status: { not: "hidden" }, tags: { some: { tag: { name: major.name, type: "major" } } } },
      include: {
        author: { select: { nickname: true, verifiedSchools: true, level: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        aiSummary: { select: { id: true, confidence: true } },
      },
      orderBy: [{ starCount: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ]);

  const bySchool = Array.from(
    new Map(
      major.reviews.map((review) => [review.school.id, { school: review.school, reviews: [] as typeof major.reviews }])
    ).values()
  );
  for (const review of major.reviews) {
    const group = bySchool.find((item) => item.school.id === review.school.id);
    if (group) group.reviews.push(review);
  }

  const schoolOptions = Array.from(
    new Map(
      major.courses.map((course) => [course.school.id, { id: course.school.id, name: course.school.name }])
    ).values()
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 text-xs font-medium text-accent">{major.category || "专业档案"}</div>
            <h1 className="text-2xl font-semibold text-ink">{major.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
              聚合不同学校在读生与校友的结构化评价，帮你在同一维度上横向比较。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-lg font-semibold text-ink">{major.reviews.length}</p>
              <p className="text-xs text-zinc-400">结构化评价</p>
            </div>
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-lg font-semibold text-ink">{bySchool.length}</p>
              <p className="text-xs text-zinc-400">开设院校</p>
            </div>
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-lg font-semibold text-ink">{questions.length}</p>
              <p className="text-xs text-zinc-400">相关提问</p>
            </div>
          </div>
        </div>
      </section>

      {major.reviews.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">整体评分</h2>
              <span className="text-xs text-zinc-400">{major.reviews.length} 个样本</span>
            </div>
            <RatingBars reviews={major.reviews} dims={REVIEW_DIMENSIONS.major} />
          </div>
          <ReviewSummaryCard reviews={major.reviews} label={`${major.name}就读体验`} dims={REVIEW_DIMENSIONS.major} />
        </div>
      )}

      {bySchool.length > 0 && (
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            <h2 className="text-base font-semibold text-ink">跨校对比</h2>
          </div>
          <div className="space-y-5">
            {bySchool.map(({ school, reviews }) => {
              const rows = averageRatings(reviews, REVIEW_DIMENSIONS.major);
              const outcomes = aggregateOutcomes(reviews);
              return (
                <div key={school.id} className="rounded-lg border border-line p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/school/${school.slug}`} className="text-sm font-semibold text-ink hover:text-accent">
                      {school.name}
                    </Link>
                    <span className="text-xs text-zinc-400">{reviews.length} 条评价</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
                    <div className="space-y-2">
                      {rows.map((row) => (
                        <div key={row.key} className="flex items-center gap-2 text-sm">
                          <span className="w-16 shrink-0 text-zinc-500">{row.label}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${((row.avg ?? 0) / 5) * 100}%` }} />
                          </div>
                          <span className="w-12 shrink-0 text-right font-medium text-ink">{row.avg ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                    {outcomes ? (
                      <div>
                        <h3 className="mb-2 text-xs font-medium text-zinc-500">毕业去向（均值）</h3>
                        <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100">
                          {Object.entries(outcomes).map(([key, value], index) => (
                            <div
                              key={key}
                              className="h-full bg-accent"
                              style={{ width: `${value}%`, opacity: 1 - index * 0.2 }}
                            />
                          ))}
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-zinc-500">
                          {Object.entries(outcomes).map(([key, value]) => (
                            <p key={key}>
                              {OUTCOME_LABELS[key] ?? key}：{value}%
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">暂无毕业去向数据</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {major.courses.length > 0 && (
        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <h2 className="text-base font-semibold text-ink">相关课程</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {major.courses.map((course) => (
              <Link
                key={course.id}
                href={`/course/${course.id}`}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-zinc-700 transition hover:border-accent hover:text-accent"
              >
                {course.school.name} · {course.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-zinc-400" />
          <h2 className="text-base font-semibold text-ink">热门提问</h2>
        </div>
        {questions.length === 0 ? (
          <p className="card p-6 text-center text-sm text-zinc-400">还没有相关问题</p>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                id={question.id}
                title={question.title}
                description={question.description}
                scenarioType={question.scenarioType}
                likeCount={question.starCount}
                favoriteCount={question.favoriteCount}
                replyCount={question.replyCount}
                createdAt={question.createdAt}
                hasSummary={Boolean(question.aiSummary)}
              folded={question.status === "folded"}
                tags={question.tags.map((item) => ({ id: item.tag.id, name: item.tag.name, slug: item.tag.slug }))}
                author={question.author}
              />
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-base font-semibold text-ink">发表结构化评价</h2>
        <p className="mb-4 text-xs text-zinc-400">仅限所选学校邮箱认证用户；请先选择你的学校。</p>
        <ReviewForm
          target="major"
          majorId={major.id}
          schoolOptions={schoolOptions}
          dimensions={REVIEW_DIMENSIONS.major}
          verifiedSchools={user?.verifiedSchools ?? []}
        />
      </section>
    </div>
  );
}
