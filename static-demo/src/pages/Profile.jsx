import { Link, Navigate } from "react-router-dom";
import { useDb } from "../store";
import * as db from "../db";
import { VerifiedBadge } from "../components";

export default function Profile() {
  const state = useDb();
  const user = db.getCurrentUser(state);
  if (!user) return <Navigate to="/login" replace />;

  const schools = JSON.parse(user.verifiedSchools || "[]");
  const current = db.LEVELS.find((l) => l.level === user.level) ?? db.LEVELS[0];
  const next = db.LEVELS[user.level + 1];
  const progress = next ? Math.min(100, Math.round(((user.starScore - current.min) / (next.min - current.min)) * 100)) : 100;

  const questions = state.questions.filter((q) => q.authorId === user.id && q.status !== "hidden").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  const replies = state.replies.filter((r) => r.authorId === user.id && r.status !== "hidden").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  const posts = state.aiPosts.filter((p) => p.authorId === user.id).slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-lg font-semibold text-white">{user.nickname.slice(0, 1)}</span>
            <div>
              <h1 className="text-lg font-semibold text-ink">{user.nickname}</h1>
              <p className="text-sm text-zinc-500">{user.bio || "这个人很懒，还没有写简介"}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <VerifiedBadge schools={schools} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-ink">{user.starScore}</p>
            <p className="text-xs text-zinc-400">star_score</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-600">{current.name}</span>
            <span className="text-zinc-400">{next ? `距 ${next.name} 还差 ${next.min - user.starScore} 分` : "已达最高等级"}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-zinc-400">{current.reward}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">我的提问</h2>
        {questions.length === 0 ? <p className="text-sm text-zinc-400">还没有提问</p> : (
          <div className="space-y-2">
            {questions.map((q) => (
              <Link key={q.id} to={`/question/${q.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{q.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{db.starCountFor(state, "question", q.id)} star · {q.replyCount} 回复 · {db.formatRelative(q.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">我的回复</h2>
        {replies.length === 0 ? <p className="text-sm text-zinc-400">还没有回复</p> : (
          <div className="space-y-2">
            {replies.map((r) => {
              const q = state.questions.find((x) => x.id === r.questionId);
              return (
                <Link key={r.id} to={`/question/${r.questionId}`} className="card block px-4 py-3 hover:border-zinc-300">
                  <p className="text-sm leading-relaxed text-ink">{r.content}</p>
                  <p className="mt-1 text-xs text-zinc-400">回复「{q?.title ?? ""}」 · {r.starCount} star · {db.formatRelative(r.createdAt)}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">我的 AI 精选帖</h2>
        {posts.length === 0 ? <p className="text-sm text-zinc-400">还没有精选帖</p> : (
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className="card px-4 py-3">
                <p className="text-sm font-medium text-ink">{p.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{p.starCount} star · {db.formatRelative(p.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
