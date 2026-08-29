import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { SchoolCard } from "../components";

export default function Schools() {
  const state = useDb();
  const schools = db.schoolStats(state).sort((a, b) => b.reviewCount - a.reviewCount || b.questionCount - a.questionCount);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-accent" />
        <h1 className="text-xl font-semibold text-ink">院校档案</h1>
        <span className="text-xs text-zinc-400">{schools.length} 所高校</span>
      </div>
      <p className="text-sm text-zinc-500">
        每所学校汇聚认证用户的结构化评价：就读体验评分、毕业去向、课程与教师榜单。按认证评价数排序。
      </p>

      {schools.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-400">暂无院校数据</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {schools.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-zinc-400">
        想对比两所学校？去 <Link to="/compare" className="text-accent hover:underline">学校对比</Link> 页
      </p>
    </div>
  );
}