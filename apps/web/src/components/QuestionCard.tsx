import Link from "next/link";
import { MessageSquare, Sparkles, Star } from "lucide-react";
import { SCENARIO_LABEL } from "@uni-insight/core";
import { cn, formatRelative, safeParse, truncate } from "@/lib/format";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface QuestionCardProps {
  id: string;
  title: string;
  description?: string | null;
  scenarioType: string;
  starCount: number;
  replyCount: number;
  createdAt: Date;
  hasSummary: boolean;
  tags: { id: string; name: string }[];
  author: { nickname: string; verifiedSchools: string; level: number };
}

export function QuestionCard({
  id,
  title,
  description,
  scenarioType,
  starCount,
  replyCount,
  createdAt,
  hasSummary,
  tags,
  author,
}: QuestionCardProps) {
  const schools = safeParse<string[]>(author.verifiedSchools, []);
  return (
    <Link
      href={`/question/${id}`}
      className="card block p-5 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm active:scale-[0.998]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-accent">
              {SCENARIO_LABEL[scenarioType as keyof typeof SCENARIO_LABEL] ?? scenarioType}
            </span>
            {hasSummary && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                AI 总结
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-semibold leading-snug text-ink">{title}</h3>
          {description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{truncate(description, 90)}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tags.slice(0, 4).map((tag) => (
          <span key={tag.id} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
            {tag.name}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Star className={cn("h-3.5 w-3.5", starCount > 0 ? "fill-amber-400 text-amber-400" : "text-zinc-400")} />
          {starCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
          {replyCount}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="font-medium text-zinc-600">{author.nickname}</span>
          <VerifiedBadge schools={schools} />
        </span>
        <span>{formatRelative(createdAt)}</span>
      </div>
    </Link>
  );
}
