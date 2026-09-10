import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Building2, GraduationCap, MessageSquare } from "lucide-react";
import { OUTCOME_LABELS, REVIEW_DIMENSIONS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { aggregateOutcomes, averageRatings } from "@/lib/reviews";
import { QuestionCard } from "@/components/QuestionCard";
import { RatingBars } from "@/components/RatingBars";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewSummaryCard } from "@/components/ReviewSummaryCard";
import { TrackView } from "@/components/TrackView";
import { MerchantCard } from "@/components/MerchantCard";
import { loadMerchantRatings } from "@/lib/merchant";

export const dynamic = "force-dynamic";

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await prisma.school.findUnique({
    where: { slug },
    include: {
      courses: {
        include: {
          major: true,
          reviews: {
            include: {
              author: { select: { nickname: true, verifiedSchools: true } },
            },
          },
        },
      },
      teachers: {
        include: {
          reviews: {
            include: {
              author: { select: { nickname: true, verifiedSchools: true } },
            },
          },
        },
      },
      reviews: {
        include: {
          author: { select: { nickname: true, verifiedSchools: true } },
        },
      },
      merchants: {
        where: { status: "active" },
        include: {
          _count: { select: { posts: { where: { status: { not: "hidden" } } } } },
        },
        take: 12,
      },
    },
  });
  if (!school) notFound();

  const [user, verifiedCount, schoolQuestions] = await Promise.all([
    getSessionUser(),
    prisma.user.count({ where: { verifiedSchools: { contains: `"${school.name}"` } } }),
    prisma.question.findMany({
      where: { status: { not: "hidden" }, tags: { some: { tag: { name: school.name, type: "school" } } } },
      include: {
        author: { select: { nickname: true, verifiedSchools: true, level: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true, type: true } } } },
        aiSummary: { select: { id: true, confidence: true } },
      },
      orderBy: [{ starCount: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ]);

  const schoolReviews = school.reviews.filter((review) => !review.courseId && !review.teacherId);
  const outcomes = aggregateOutcomes(schoolReviews);
  const majors = Array.from(
    school.courses
      .reduce((map, course) => {
        if (course.major) map.set(course.major.id, course.major);
        return map;
      }, new Map<string, NonNullable<typeof school.courses[number]["major"]>>())
      .values()
  );
  const courseRanking = school.courses
    .map((course) => {
      const rows = averageRatings(course.reviews, REVIEW_DIMENSIONS.course);
      const rated = rows.filter((row) => row.avg !== null);
      const avg = rated.length
        ? Math.round((rated.reduce((sum, row) => sum + (row.avg ?? 0), 0) / rated.length) * 10) / 10
        : null;
      return { course, avg, reviewCount: course.reviews.length };
    })
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  const teacherRanking = school.teachers
    .map((teacher) => {
      const rows = averageRatings(teacher.reviews, REVIEW_DIMENSIONS.teacher);
      const rated = rows.filter((row) => row.avg !== null);
      const avg = rated.length
        ? Math.round((rated.reduce((sum, row) => sum + (row.avg ?? 0), 0) / rated.length) * 10) / 10
        : null;
      return { teacher, avg, reviewCount: teacher.reviews.length };
    })
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  const canReview = user?.verifiedSchools.includes(school.name) ?? false;
  const merchantRatings = await loadMerchantRatings(school.merchants.map((m) => m.id));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <TrackView
        actionType="view"
        targetType="school"
        targetId={school.id}
        tags={[`school:${school.name}`, school.region ? `region:${school.region}` : ""].filter(Boolean)}
      />
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">
                <Building2 className="h-3.5 w-3.5" />
                {school.region || "地区未知"} · {school.type || "高校"}
              </span>
              {school.verified && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-600">
                  <GraduationCap className="h-3.5 w-3.5" />
                  已认证档案
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-ink">{school.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{school.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-lg font-semibold text-ink">{verifiedCount}</p>
              <p className="text-xs text-zinc-400">认证用户</p>
            </div>
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-lg font-semibold text-ink">{school.reviews.length}</p>
              <p className="text-xs text-zinc-400">结构化评价</p>
            </div>
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-lg font-semibold text-ink">{schoolQuestions.length}</p>
              <p className="text-xs text-zinc-400">相关提问</p>
            </div>
          </div>
        </div>
      </section>

      {schoolReviews.length > 0 && (

      <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">就读体验评分</h2>
              <span className="text-xs text-zinc-400">{schoolReviews.length} 个样本</span>
            </div>
            <RatingBars reviews={schoolReviews} dims={REVIEW_DIMENSIONS.school} />
            {outcomes && (
              <div className="mt-5 border-t border-line pt-4">
                <h3 className="mb-2 text-sm font-medium text-zinc-600">毕业去向占比（均值）</h3>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-zinc-100">
                  {Object.entries(outcomes).map(([key, value]) => (
                    <div
                      key={key}
                      className="h-full bg-accent first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${value}%`, opacity: 1 - Object.keys(outcomes).indexOf(key) * 0.2 }}
                      title={`${OUTCOME_LABELS[key] ?? key} ${value}%`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                  {Object.entries(outcomes).map(([key, value]) => (
                    <span key={key}>
                      {OUTCOME_LABELS[key] ?? key} {value}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <ReviewSummaryCard reviews={schoolReviews} label={`${school.name}就读体验`} dims={REVIEW_DIMENSIONS.school} />
        </div>
      )}

        {school.merchants.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">周边生活</h2>
            <Link href={`/places?tab=campus&school=${school.id}`} className="text-xs text-accent hover:underline">查看全部 →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {school.merchants.map((m) => (
              <MerchantCard
                key={m.id}
                merchant={{ id: m.id, name: m.name, category: m.category, tier: m.tier, claimStatus: m.claimStatus, city: m.city, address: m.address, description: m.description, school: { name: school.name, slug: school.slug } }}
                rating={merchantRatings.get(m.id) ?? { rating: 0, scoredCount: 0, reviewCount: 0, insufficient: true }}
                postCount={m._count.posts}
              />
            ))}
          </div>
        </section>
      )}

      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          <h2 className="text-base font-semibold text-ink">专业设置</h2>
        </div>
        {majors.length === 0 ? (
          <p className="text-sm text-zinc-400">暂无专业数据</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {majors.map((major) => (
              <Link
                key={major.id}
                href={`/major/${major.slug}`}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-zinc-700 transition hover:border-accent hover:text-accent"
              >
                {major.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">课程榜单</h2>
            <span className="text-xs text-zinc-400">按评价均分排序</span>
          </div>
          <div className="space-y-2">
            {courseRanking.map(({ course, avg, reviewCount }) => (
              <Link key={course.id} href={`/course/${course.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 transition hover:border-zinc-300 hover:bg-zinc-50">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{course.name}</span>
                  <span className="text-xs text-zinc-400">{course.major?.name ?? "未分类"} · {reviewCount} 条评价</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-accent">{avg === null ? "—" : avg}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">教师档案</h2>
            <span className="text-xs text-zinc-400">按评价均分排序</span>
          </div>
          <div className="space-y-2">
            {teacherRanking.map(({ teacher, avg, reviewCount }) => (
              <Link key={teacher.id} href={`/teacher/${teacher.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 transition hover:border-zinc-300 hover:bg-zinc-50">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{teacher.name}</span>
                  <span className="text-xs text-zinc-400">{teacher.department ?? "院系未知"} · {teacher.title ?? "教师"} · {reviewCount} 条评价</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-accent">{avg === null ? "—" : avg}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-zinc-400" />
          <h2 className="text-base font-semibold text-ink">热门提问</h2>
        </div>
        {schoolQuestions.length === 0 ? (
          <p className="card p-6 text-center text-sm text-zinc-400">还没有相关问题</p>
        ) : (
          <div className="space-y-3">
            {schoolQuestions.map((question) => (
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
                tags={question.tags.map((item) => ({ id: item.tag.id, name: item.tag.name, slug: item.tag.slug, type: item.tag.type }))}
                author={question.author}
              />
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-base font-semibold text-ink">发表结构化评价</h2>
        <p className="mb-4 text-xs text-zinc-400">仅限通过该校邮箱认证的用户；评分会聚合到学校档案与对比页。</p>
        <ReviewForm
          schoolId={school.id}
          schoolName={school.name}
          target="school"
          dimensions={REVIEW_DIMENSIONS.school}
          canReview={canReview}
        />
      </section>
    </div>
  );
}
