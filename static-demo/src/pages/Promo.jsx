import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { ExperiencePostCard } from "../components";

export default function Promo() {
  const state = useDb();
  const posts = db.getExperiencePosts(state, { type: "promo" });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-ink">推广池</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">商家委托的推广内容，均已明示标注，不进入经验帖/推荐流。内容仍接受点赞、收藏与监督。</p>
        </div>
        <Link to="/posts" className="btn-ghost whitespace-nowrap">返回经验帖</Link>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        推广帖由学生受商家委托发布并明示标注；平台仅提供展示位，内容真实性由评论区与举报机制监督。
      </div>

      {posts.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-400">推广池还是空的。发布经验帖时选择「商家推广」即可进入这里</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => <ExperiencePostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}