import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { ExperiencePostCard } from "../components";

export default function Posts() {
  const state = useDb();
  const [params, setParams] = useSearchParams();
  const type = params.get("type") ?? "";
  const posts = db.getExperiencePosts(state, { type });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">经验帖 / 避雷帖</h1>
          <p className="mt-1 text-sm text-zinc-500">学长学姐的真实就读 / 申请 / 求职经验，以及踩过的坑</p>
        </div>
        <Link to="/posts/new" className="btn-primary whitespace-nowrap">
          <Plus className="h-4 w-4" />
          写经验帖
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setParams({})}
          className={`rounded-md px-3 py-1.5 text-sm transition ${!type ? "bg-ink text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          全部
        </button>
        {db.POST_TYPES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setParams({ type: item.key })}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              type === item.key ? (item.key === "avoid" ? "bg-red-600 text-white" : "bg-accent text-white") : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-400">还没有经验帖，成为第一个分享真实经历的人</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <ExperiencePostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}