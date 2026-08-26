import { Sparkles } from "lucide-react";
import { buildReviewSummary, type ReviewLike } from "@/lib/reviews";

interface ReviewSummaryCardProps {
  reviews: ReviewLike[];
  label: string;
  dims: { key: string; label: string }[];
}

export function ReviewSummaryCard({ reviews, label, dims }: ReviewSummaryCardProps) {
  const summary = buildReviewSummary(reviews, label, dims);
  if (!summary) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50/50">
      <div className="flex items-center gap-2 border-b border-blue-100 px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-ink">AI 聚合摘要</h2>
      </div>
      <div className="space-y-3 px-4 py-3">
        <p className="text-sm leading-relaxed text-ink">{summary.overview}</p>
        {summary.strengths.length > 0 && (
          <div>
            <h3 className="mb-1 text-xs font-medium text-zinc-500">优势</h3>
            <ul className="list-disc space-y-1 pl-4 text-sm text-ink">
              {summary.strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {summary.weaknesses.length > 0 && (
          <div>
            <h3 className="mb-1 text-xs font-medium text-zinc-500">需要注意</h3>
            <ul className="list-disc space-y-1 pl-4 text-sm text-ink">
              {summary.weaknesses.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-zinc-400">{summary.note}</p>
      </div>
    </div>
  );
}
