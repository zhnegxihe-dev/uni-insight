import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { QuestionCard, RatingBars, ReviewList, ReviewForm } from "../components";

export default function Major() {
  const { slug } = useParams();
  const state = useDb();
  const major = db.getMajor(state, slug);
  if (!major) return <div className="card p-10 text-center text-sm text-zinc-400">专业不存在</div>;

  const reviews = major.reviews.map((r) => ({ ...r, author: state.users.find((u) => u.id === r.authorId) }));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />返回发现页
      </Link>

      <section className="card p-6">
        <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500">
          <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">{major.category || "专业"}</span>
        </div>
        <h1 className="text-2xl font-semibold text-ink">{major.name}</h1>
        <p className="mt-2 text-sm text-zinc-500">{major.courses.length} 门相关课程 · {reviews.length} 条结构化评价</p>
      </section>

      {reviews.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-4 text-base font-semibold text-ink">专业评价</h2>
          <RatingBars reviews={reviews} dims={[
            { key: "teaching", label: "教学" }, { key: "workload", label: "课业量" }, { key: "difficulty", label: "难度" },
            { key: "employment", label: "就业口碑" }, { key: "atmosphere", label: "同学氛围" },
          ]} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">相关课程</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {major.courses.map((c) => (
            <Link key={c.id} to={`/course/${c.id}`} className="card px-4 py-3 hover:border-zinc-300">
              <p className="text-sm font-medium text-ink">{c.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{c.code}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">热门提问</h2>
        {major.questions.length === 0 ? <p className="text-sm text-zinc-400">暂无提问</p> : (
          <div className="space-y-3">
            {major.questions.map((q) => <QuestionCard key={q.id} question={q} folded={q.status === "folded"} />)}
          </div>
        )}
      </section>
    </div>
  );
}
