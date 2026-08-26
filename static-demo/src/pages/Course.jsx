import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { RatingBars, ReviewList, ReviewForm } from "../components";

const COURSE_DIMS = [
  { key: "teaching", label: "教学质量" },
  { key: "workload", label: "课业量" },
  { key: "difficulty", label: "难度" },
  { key: "grading", label: "给分友好度" },
  { key: "career", label: "职业有用性" },
];

export default function Course() {
  const { id } = useParams();
  const state = useDb();
  const course = db.getCourse(state, id);
  if (!course) return <div className="card p-10 text-center text-sm text-zinc-400">课程不存在</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to={`/school/${course.school.slug}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />返回 {course.school.name}
      </Link>

      <section className="card p-6">
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">{course.code || "课程"}</span>
          {course.major && <Link to={`/major/${course.major.slug}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 hover:text-accent">{course.major.name}</Link>}
          <span>{course.school.name}</span>
        </div>
        <h1 className="text-xl font-semibold text-ink">{course.name}</h1>
        <p className="mt-2 text-sm text-zinc-500">{course.reviews.length} 条结构化评价 · 样本虽小但都来自该校认证用户</p>
      </section>

      {course.reviews.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-4 text-base font-semibold text-ink">维度评分</h2>
          <RatingBars reviews={course.reviews} dims={COURSE_DIMS} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">全部评价</h2>
        {course.reviews.length === 0 ? (
          <p className="card p-8 text-center text-sm text-zinc-400">还没有课程评价，成为第一个分享的人</p>
        ) : (
          <ReviewList reviews={course.reviews} />
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-base font-semibold text-ink">发表课程评价</h2>
        <p className="mb-4 text-xs text-zinc-400">仅限通过该学校邮箱认证的用户。</p>
        <ReviewForm schoolId={course.schoolId} schoolName={course.school.name} target="course" courseId={course.id} dims={COURSE_DIMS} />
      </section>
    </div>
  );
}
