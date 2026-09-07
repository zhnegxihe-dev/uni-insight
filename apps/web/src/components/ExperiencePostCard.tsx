import Link from "next/link";
import { Bookmark, CornerUpRight, Heart, ShieldAlert } from "lucide-react";
import { POST_TYPES } from "@/lib/core";
import { cn, formatRelative, safeParse } from "@/lib/format";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface ExperiencePostCardProps {
  id: string;
  title: string;
  content: string;
  postType: string;
  merchantName?: string | null;
  images: string[];
  likeCount: number;
  favoriteCount: number;
  status: string;
  createdAt: Date;
  fromReply?: boolean;
  school?: { name: string; slug: string } | null;
  major?: { name: string; slug: string } | null;
  author: { nickname: string; verifiedSchools: string; level: number };
}

export function ExperiencePostCard({
  id,
  title,
  content,
  postType,
  merchantName,
  images,
  likeCount,
  favoriteCount,
  status,
  createdAt,
  fromReply,
  school,
  major,
  author,
}: ExperiencePostCardProps) {
  const typeMeta = POST_TYPES.find((p) => p.key === postType);
  const isAvoid = postType === "avoid";
  const isPromo = postType === "promo";
  const schools = safeParse<string[]>(author.verifiedSchools, []);
  const cover = images[0];

  return (
    <div className="card block p-5 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium",
                isAvoid ? "bg-red-50 text-red-600" : isPromo ? "bg-blue-600 text-white" : "bg-blue-50 text-accent"
              )}
              title={isPromo ? "受商家委托的推广内容，已在独立推广池明示" : undefined}
            >
              {typeMeta?.label ?? postType}
              {isPromo && merchantName ? ` · ${merchantName}` : ""}
            </span>
            {status === "folded" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                <ShieldAlert className="h-3.5 w-3.5" />
                已折叠
              </span>
            )}
            {fromReply && (
              <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-600" title="这条帖子由一条回复升级/引用而来，可点击进入查看来源">
                <CornerUpRight className="h-3 w-3" />
                由回复生成
              </span>
            )}
          </div>
          <Link href={`/posts/${id}`} className="text-[15px] font-semibold leading-snug text-ink hover:text-accent">
            {title}
          </Link>
          <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{content}</p>
        </div>
        {cover && (
          <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="配图" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {(school || major) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {school && (
            <Link href={`/school/${school.slug}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 transition hover:bg-blue-50 hover:text-accent">
              {school.name}
            </Link>
          )}
          {major && (
            <Link href={`/major/${major.slug}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 transition hover:bg-blue-50 hover:text-accent">
              {major.name}
            </Link>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Heart className={cn("h-3.5 w-3.5", likeCount > 0 ? "fill-rose-400 text-rose-400" : "text-zinc-400")} />
          {likeCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <Bookmark className={cn("h-3.5 w-3.5", favoriteCount > 0 ? "fill-blue-400 text-blue-400" : "text-zinc-400")} />
          {favoriteCount}
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