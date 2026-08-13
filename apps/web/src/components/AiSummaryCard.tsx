"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/format";

interface AiSummaryCardProps {
  summaryJson: string;
  sampleNote?: string | null;
  confidence?: string | null;
  locked?: boolean;
}

export function AiSummaryCard({ summaryJson, sampleNote, confidence, locked }: AiSummaryCardProps) {
  const [open, setOpen] = useState(false);
  let summary: Record<string, unknown> = {};
  try {
    summary = JSON.parse(summaryJson) as Record<string, unknown>;
  } catch {
    summary = {};
  }

  const sections: { key: string; label: string; value: unknown }[] = [
    { key: "overview", label: "总体评价", value: summary.overview },
    { key: "curriculum_insight", label: "课程内容", value: summary.curriculum_insight },
    { key: "job_prospect", label: "就业真实情况", value: summary.job_prospect },
    { key: "industry_outlook", label: "行业环境", value: summary.industry_outlook },
    { key: "advisor_insight", label: "导师洞察", value: summary.advisor_insight },
    { key: "advice", label: "学长学姐建议", value: summary.advice },
  ].filter((s) => s.value);

  return (
    <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50/50">
      <div className="flex items-center gap-2 border-b border-blue-100 px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-ink">AI 聚合卡片</h2>
        {locked && (
          <span className="inline-flex items-center gap-1 text-xs text-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            已由管理员复核
          </span>
        )}
        <span className="ml-auto text-xs text-zinc-500">{sampleNote ?? "基于真实回复生成"}</span>
      </div>

      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed text-ink">{String(summary.overview ?? "")}</p>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent"
        >
          展开详情
          <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-blue-100 px-4 py-3">
          {sections.map((section) => (
            <div key={section.key}>
              <h3 className="mb-0.5 text-xs font-medium text-zinc-500">{section.label}</h3>
              {Array.isArray(section.value) ? (
                <ul className="list-disc space-y-1 pl-4 text-sm text-ink">
                  {(section.value as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-ink">{String(section.value)}</p>
              )}
            </div>
          ))}
          {Array.isArray(summary.disagreements) && summary.disagreements.length > 0 && (
            <div>
              <h3 className="mb-0.5 text-xs font-medium text-zinc-500">存在分歧</h3>
              <ul className="list-disc space-y-1 pl-4 text-sm text-ink">
                {summary.disagreements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {confidence && (
            <p className="text-xs text-zinc-400">
              置信度：{confidence === "high" ? "高" : confidence === "medium" ? "中" : "低（样本较少，仅供参考）"}
            </p>
          )}
          <p className="text-xs text-zinc-400">AI 仅整理学生观点，不构成官方信息。</p>
        </div>
      )}
    </div>
  );
}
