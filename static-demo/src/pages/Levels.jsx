import { Star } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";

export default function Levels() {
  const state = useDb();
  const user = db.getCurrentUser(state);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold text-ink">积分等级</h1>
      <p className="text-sm text-zinc-500">
        点赞让真实经验获得认可，收藏留住有用信息，star_score 由点赞/采纳/认证等累计。{user ? `你当前 L${user.level} · ${user.starScore} 分` : "登录后查看你的等级"}
      </p>

      <section className="card p-5">
        <h2 className="mb-3 text-base font-semibold text-ink">等级阈值</h2>
        <div className="space-y-3">
          {db.LEVELS.map((l) => (
            <div key={l.level} className={`rounded-lg border p-4 ${user?.level === l.level ? "border-accent bg-blue-50/50" : "border-line"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{l.name}</span>
                <span className="text-xs text-zinc-400">{l.min}+ 分</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{l.reward}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
          <Star className="h-4 w-4 text-amber-400" />计分规则
        </h2>
        <ul className="space-y-1.5 text-sm text-zinc-600">
          <li>· 我发布的提问被点赞：+1</li>
          <li>· 我发布的回复被点赞：+2</li>
          <li>· 我发布的经验帖/避雷帖被点赞：+3</li>
          <li>· 回复被采纳：+10</li>
          <li>· AI 精选帖被点赞：+5</li>
          <li>· 有效举报：+5（每日上限 5）</li>
          <li>· 学校邮箱认证：+20（一次性）</li>
          <li>· 收藏不计分，但会提高内容在推荐中的权重</li>
        </ul>
      </section>
    </div>
  );
}
