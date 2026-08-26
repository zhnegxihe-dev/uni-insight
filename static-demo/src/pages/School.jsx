import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { QuestionCard, RatingBars, VerifiedBadge } from "../components";

export default function School() {
  const { slug } = useParams();
  const state = useDb();
  const school = db.getSchool(state, slug);
  if (!school) return <div className="card p-10 text-center text-sm text-zinc-400">学校不存在</div>;

  const reviews = school.reviews.map((r) => ({ ...r, author: state.users.find((u) => u.id === r.authorId) }));
  const verifiedCount = state.users.filter((u) => JSON.parse(u.verifiedSchools || "[]").includes(school.name)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />返回发现页
      </Link>

      <section className="card p-6">
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">{school.region || "地区未知"} · {school.type || "高校"}</span>
          {school.verified && <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-600">已认证档案</span>}
        </div>
        <h1 className="text-2xl font-semibold text-ink">{school.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{school.description}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
          <span><span className="font-semibold text-ink">{verifiedCount}</span> 认证用户</span>
          <span><span className="font-semibold text-ink">{reviews.length}</span> 结构化评价</span>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-4 text-base font-semibold text-ink">学校评价</h2>
          <RatingBars reviews={reviews} dims={[
            { key: "teaching", label: "教学" }, { key: "workload", label: "课业量" }, { key: "difficulty", label: "难度" },
            { key: "employment", label: "就业口碑" }, { key: "atmosphere", label: "同学氛围" },
          ]} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">课程</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {school.courses.map((c) => (
            <Link key={c.id} to={`/course/${c.id}`} className="card px-4 py-3 hover:border-zinc-300">
              <p className="text-sm font-medium text-ink">{c.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{c.code} · {c.major?.name ?? "未分类"}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">教师</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {school.teachers.map((t) => (
            <Link key={t.id} to={`/teacher/${t.id}`} className="card px-4 py-3 hover:border-zinc-300">
              <p className="text-sm font-medium text-ink">{t.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{t.department ?? "院系未知"} · {t.title ?? "教师"}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">热门提问</h2>
        {school.questions.length === 0 ? <p className="text-sm text-zinc-400">暂无提问</p> : (
          <div className="space-y-3">
            {school.questions.map((q) => (
              <QuestionCard key={q.id} question={q} folded={q.status === "folded"} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
