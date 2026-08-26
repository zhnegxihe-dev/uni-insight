import { Link, useParams } from "react-router-dom";
import { ChevronLeft, UserRound } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { RatingBars, ReviewList, ReviewForm } from "../components";

const TEACHER_DIMS = [
  { key: "teaching", label: "教学清晰度" },
  { key: "patience", label: "答疑耐心" },
  { key: "grading", label: "给分" },
  { key: "guidance", label: "指导频率" },
  { key: "push", label: "push 程度" },
  { key: "atmosphere", label: "课题组氛围" },
  { key: "career", label: "毕业去向" },
  { key: "resources", label: "学术资源" },
];

export default function Teacher() {
  const { id } = useParams();
  const state = useDb();
  const teacher = db.getTeacher(state, id);
  if (!teacher) return <div className="card p-10 text-center text-sm text-zinc-400">教师不存在</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to={`/school/${teacher.school.slug}`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />返回 {teacher.school.name}
      </Link>

      <section className="card p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-white">
            <UserRound className="h-6 w-6" />
          </span>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">{teacher.title || "教师"}</span>
              <span>{teacher.department || "院系未知"}</span>
              <span>{teacher.school.name}</span>
            </div>
            <h1 className="text-xl font-semibold text-ink">{teacher.name}</h1>
            <p className="mt-2 text-sm text-zinc-500">{teacher.reviews.length} 条结构化评价 · 包含课堂体验与课题组观察</p>
          </div>
        </div>
      </section>

      {teacher.reviews.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-4 text-base font-semibold text-ink">维度评分</h2>
          <RatingBars reviews={teacher.reviews} dims={TEACHER_DIMS} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">全部评价</h2>
        {teacher.reviews.length === 0 ? (
          <p className="card p-8 text-center text-sm text-zinc-400">还没有教师评价，成为第一个分享的人</p>
        ) : (
          <ReviewList reviews={teacher.reviews} />
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-base font-semibold text-ink">发表教师评价</h2>
        <p className="mb-4 text-xs text-zinc-400">仅限通过该学校邮箱认证的用户。</p>
        <ReviewForm schoolId={teacher.schoolId} schoolName={teacher.school.name} target="teacher" teacherId={teacher.id} dims={TEACHER_DIMS} />
      </section>
    </div>
  );
}
