import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { REVIEW_DIMENSIONS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ratingDistribution } from "@/lib/reviews";
import { RatingBars } from "@/components/RatingBars";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewSummaryCard } from "@/components/ReviewSummaryCard";
import { ReviewListItem } from "@/components/ReviewListItem";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      school: true,
      major: true,
      reviews: {
        include: {
          author: { select: { nickname: true, verifiedSchools: true, level: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!course) notFound();

  const user = await getSessionUser();
  const distribution = ratingDistribution(course.reviews, "teaching");
  const dims = REVIEW_DIMENSIONS.course;
  const canReview = user?.verifiedSchools.includes(course.school.name) ?? false;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/school/${course.school.slug}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回 {course.school.name}
      </Link>

      <section className="card p-6">
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">{course.code || "课程"}</span>
          {course.major && (
            <Link href={`/major/${course.major.slug}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 hover:text-accent">
              {course.major.name}
            </Link>
          )}
          <span>{course.school.name}</span>
        </div>
        <h1 className="text-xl font-semibold text-ink">{course.name}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {course.reviews.length} 条结构化评价 · 样本虽小但都来自该校认证用户
        </p>
      </section>

      {course.reviews.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">维度评分</h2>
              <span className="text-xs text-zinc-400">{course.reviews.length} 个样本</span>
            </div>
            <RatingBars reviews={course.reviews} dims={dims} />
            <div className="mt-5 border-t border-line pt-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-600">教学质量分布</h3>
              <div className="space-y-1">
                {distribution.map((count, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="w-6">{index + 1} 星</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(count / Math.max(1, course.reviews.length)) * 100}%` }}
                      />
                    </div>
                    <span className="w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ReviewSummaryCard reviews={course.reviews} label={`${course.school.name}·${course.name}`} dims={dims} />
        </div>
      ) : (
        <div className="card p-8 text-center text-sm text-zinc-400">还没有课程评价，成为第一个分享的人</div>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">全部评价</h2>
        <div className="space-y-3">
          {course.reviews.map((review) => (
            <ReviewListItem
              key={review.id}
              id={review.id}
              content={review.content}
              status={review.status}
              degreeLevel={review.degreeLevel}
              enrolledYear={review.enrolledYear}
              isAlumni={review.isAlumni}
              createdAt={review.createdAt}
              author={review.author}
            />
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-base font-semibold text-ink">发表课程评价</h2>
        <p className="mb-4 text-xs text-zinc-400">仅限通过该学校邮箱认证的用户。</p>
        <ReviewForm
          schoolId={course.schoolId}
          schoolName={course.school.name}
          target="course"
          courseId={course.id}
          dimensions={dims}
          canReview={canReview}
        />
      </section>
    </div>
  );
}
