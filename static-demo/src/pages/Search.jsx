import { Link, useSearchParams } from "react-router-dom";
import { useDb } from "../store";
import * as db from "../db";
import { QuestionCard } from "../components";

function Group({ title, count, children }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-zinc-500">
        {title} <span className="font-normal text-zinc-400">({count})</span>
      </h2>
      {children}
    </section>
  );
}

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const state = useDb();
  const result = db.search(state, q);
  const total = result.questions.length + result.schools.length + result.majors.length + result.courses.length + result.teachers.length + result.experiencePosts.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">搜索</h1>
        <p className="mt-1 text-sm text-zinc-500">{q ? `“${q}” 找到 ${total} 条结果` : "输入关键词开始搜索"}</p>
      </div>

      {q && total === 0 && <div className="card p-8 text-center text-sm text-zinc-400">没有找到相关内容，换个关键词试试</div>}

      {q && result.experiencePosts.length > 0 && (
        <Group title="经验帖" count={result.experiencePosts.length}>
          <div className="space-y-3">
            {result.experiencePosts.map((post) => (
              <Link key={post.id} to={`/posts/${post.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">
                  <span className={`mr-1.5 rounded px-1 py-0.5 text-[11px] font-medium ${post.postType === "avoid" ? "bg-red-50 text-red-600" : "bg-blue-50 text-accent"}`}>
                    {post.postType === "avoid" ? "避雷帖" : "经验帖"}
                  </span>
                  {post.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{post.content}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {db.starCountFor(state, "experience_post", post.id)} 点赞 · {db.favoriteCountFor(state, "experience_post", post.id)} 收藏 · {db.formatRelative(post.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </Group>
      )}

      {q && result.questions.length > 0 && (
        <Group title="问题" count={result.questions.length}>
          <div className="space-y-3">
            {result.questions.map((question) => <QuestionCard key={question.id} question={question} />)}
          </div>
        </Group>
      )}

      {result.schools.length > 0 && (
        <Group title="学校" count={result.schools.length}>
          <div className="space-y-2">
            {result.schools.map((s) => (
              <Link key={s.id} to={`/school/${s.slug}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{s.name}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{s.region ?? ""} · {s.type ?? "高校"}</p>
              </Link>
            ))}
          </div>
        </Group>
      )}

      {result.majors.length > 0 && (
        <Group title="专业" count={result.majors.length}>
          <div className="space-y-2">
            {result.majors.map((m) => (
              <Link key={m.id} to={`/major/${m.slug}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{m.name}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{m.category ?? ""}</p>
              </Link>
            ))}
          </div>
        </Group>
      )}

      {result.courses.length > 0 && (
        <Group title="课程" count={result.courses.length}>
          <div className="space-y-2">
            {result.courses.map((c) => {
              const school = state.schools.find((s) => s.id === c.schoolId);
              return (
                <Link key={c.id} to={`/course/${c.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                  <p className="text-sm font-medium text-ink">{c.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{c.code} · {school?.name ?? ""}</p>
                </Link>
              );
            })}
          </div>
        </Group>
      )}

      {result.teachers.length > 0 && (
        <Group title="教师" count={result.teachers.length}>
          <div className="space-y-2">
            {result.teachers.map((t) => {
              const school = state.schools.find((s) => s.id === t.schoolId);
              return (
                <Link key={t.id} to={`/teacher/${t.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{t.department ?? ""} · {school?.name ?? ""}</p>
                </Link>
              );
            })}
          </div>
        </Group>
      )}
    </div>
  );
}
