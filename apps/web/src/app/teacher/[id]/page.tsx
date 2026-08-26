import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, UserRound } from "lucide-react";
import { REVIEW_DIMENSIONS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ratingDistribution } from "@/lib/reviews";
import { RatingBars } from "@/components/RatingBars";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewSummaryCard } from "@/components/ReviewSummaryCard";
import { ReviewListItem } from "@/components/ReviewListItem";

export const dynamic = "force-dynamic";

export default async function TeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      school: true,
      reviews: {
        include: {
          author: { select: { nickname: true, verifiedSchools: true, level: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!teacher) notFound();

  const user = await getSessionUser();
  const dims = REVIEW_DIMENSIONS.teacher;
  const distribution = ratingDistribution(teacher.reviews, "guidance");
  const canReview = user?.verifiedSchools.includes(teacher.school.name) ?? false;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/school/${teacher.school.slug}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回 {teacher.school.name}
      </Link>

      <section className="card p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-white">
            <UserRound className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">{teacher.title || "教师"}</span>
              <span>{teacher.department || "院系未知"}</span>
              <span>{teacher.school.name}</span>
            </div>
            <h1 className="text-xl font-semibold text-ink">{teacher.name}</h1>
            <p className="mt-2 text-sm text-zinc-500">
              {teacher.reviews.length} 条结构化评价 · 包含课堂体验与课题组观察
            </p>
          </div>
        </div>
      </section>

      {teacher.reviews.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">维度评分</h2>
              <span className="text-xs text-zinc-400">{teacher.reviews.length} 个样本</span>
            </div>
            <RatingBars reviews={teacher.reviews} dims={dims} />
            <div className="mt-5 border-t border-line pt-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-600">指导频率分布</h3>
              <div className="space-y-1">
                {distribution.map((count, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="w-6">{index + 1} 星</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(count / Math.max(1, teacher.reviews.length)) * 100}%` }}
                      />
                    </div>
                    <span className="w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ReviewSummaryCard reviews={teacher.reviews} label={`${teacher.school.name}·${teacher.name}`} dims={dims} />
        </div>
      ) : (
        <div className="card p-8 text-center text-sm text-zinc-400">还没有教师评价，成为第一个分享的人</div>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">全部评价</h2>
        <div className="space-y-3">
          {teacher.reviews.map((review) => (
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
        <h2 className="mb-1 text-base font-semibold text-ink">发表教师评价</h2>
        <p className="mb-4 text-xs text-zinc-400">仅限通过该学校邮箱认证的用户。</p>
        <ReviewForm
          schoolId={teacher.schoolId}
          schoolName={teacher.school.name}
          target="teacher"
          teacherId={teacher.id}
          dimensions={dims}
          canReview={canReview}
        />
      </section>
    </div>
  );
}
