import Link from "next/link";
import { BookOpen, Building2, MessageSquare, Star } from "lucide-react";
import type { SchoolStats } from "@/lib/schools";

/** 学校卡片：档案统计摘要，点击进入学校页 */
export function SchoolCard({ school }: { school: SchoolStats }) {
  return (
    <Link
      href={`/school/${school.slug}`}
      className="card block p-5 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">
              <Building2 className="h-3 w-3" />
              {school.region || "地区未知"} · {school.type || "高校"}
            </span>
            {school.verified && (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-600">已认证档案</span>
            )}
          </div>
          <p className="text-[15px] font-semibold text-ink transition-colors hover:text-accent">{school.name}</p>
        </div>
        <span className="shrink-0 text-2xl font-semibold text-accent">{school.reviewCount}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1" title="认证评价数">
          <Star className="h-3.5 w-3.5 text-zinc-400" />
          {school.reviewCount} 条认证评价
        </span>
        <span className="inline-flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
          {school.majorCount} 个专业
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
          {school.questionCount} 条提问
        </span>
      </div>
    </Link>
  );
}