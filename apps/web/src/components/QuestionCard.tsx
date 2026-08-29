import Link from "next/link";
import { Bookmark, Heart, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import { SCENARIO_LABEL } from "@/lib/core";
import { cn, formatRelative, safeParse, truncate } from "@/lib/format";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface QuestionCardProps {
  id: string;
  title: string;
  description?: string | null;
  scenarioType: string;
  likeCount: number;
  favoriteCount: number;
  replyCount: number;
  createdAt: Date;
  hasSummary: boolean;
  folded?: boolean;
  tags: { id: string; name: string; slug?: string; type?: string }[];
  author: { nickname: string; verifiedSchools: string; level: number };
}

export function QuestionCard({
  id,
  title,
  description,
  scenarioType,
  likeCount,
  favoriteCount,
  replyCount,
  createdAt,
  hasSummary,
  folded,
  tags,
  author,
}: QuestionCardProps) {
  const schools = safeParse<string[]>(author.verifiedSchools, []);
  return (
    <div className="card block p-5 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm">
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
            {folded && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                <ShieldAlert className="h-3.5 w-3.5" />
                已折叠
              </span>
            )}
          </div>
          <Link href={`/question/${id}`} className="text-[15px] font-semibold leading-snug text-ink hover:text-accent">
            {title}
          </Link>
          {description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{truncate(description, 90)}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tags.slice(0, 4).map((tag) => {
          const href =
            tag.type === "school"
              ? `/school/${tag.slug}`
              : tag.type === "major"
                ? `/major/${tag.slug}`
                : tag.slug
                  ? `/tag/${tag.slug}`
                  : null;
          return href ? (
            <Link
              key={tag.id}
              href={href}
              className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 transition hover:bg-blue-50 hover:text-accent"
            >
              {tag.name}
            </Link>
          ) : (
            <span key={tag.id} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
              {tag.name}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1" title="点赞数">
          <Heart className={cn("h-3.5 w-3.5", likeCount > 0 ? "fill-rose-400 text-rose-400" : "text-zinc-400")} />
          {likeCount}
        </span>
        <span className="inline-flex items-center gap-1" title="收藏数">
          <Bookmark className={cn("h-3.5 w-3.5", favoriteCount > 0 ? "fill-blue-400 text-blue-400" : "text-zinc-400")} />
          {favoriteCount}
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
    </div>
  );
}