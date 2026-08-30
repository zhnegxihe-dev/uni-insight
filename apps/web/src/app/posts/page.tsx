import Link from "next/link";
import { Bookmark, Heart, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { POST_TYPES, SCENARIOS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { hotScorePost } from "@/lib/recommend";
import { cn } from "@/lib/format";
import { ExperiencePostCard } from "@/components/ExperiencePostCard";

export const dynamic = "force-dynamic";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; scenario?: string }>;
}) {
  const params = await searchParams;
  const type = params.type ?? "";
  const scenario = params.scenario ?? "";

  const where: Prisma.ExperiencePostWhereInput = { status: { not: "hidden" } };
  if (type === "experience" || type === "avoid") {
    where.postType = type;
  } else {
    where.postType = { not: "promo" }; // 信任池默认排除推广帖
  }
  if (scenario && SCENARIOS.some((s) => s.type === scenario)) where.scenarioType = scenario;

  const posts = await prisma.experiencePost.findMany({
    where,
    include: {
      author: { select: { nickname: true, verifiedSchools: true, level: true, trustScore: true } },
      school: { select: { id: true, name: true, slug: true } },
      major: { select: { id: true, name: true, slug: true } },
    },
    take: 60,
  });
  // 信任池排序：热度 + 诚信分微调加权（诚信高的作者内容略优先）
  const sorted = [...posts].sort(
    (a, b) =>
      hotScorePost(b) + (b.author?.trustScore ?? 0) * 0.001 -
      (hotScorePost(a) + (a.author?.trustScore ?? 0) * 0.001)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">经验帖 / 避雷帖</h1>
          <p className="mt-1 text-sm text-zinc-500">学长学姐的真实就读 / 申请 / 求职经验，以及踩过的坑</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/promo" className="btn-ghost whitespace-nowrap">
            推广池
          </Link>
          <Link href="/posts/new" className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" />
            写经验帖
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/posts"
          className={cn("rounded-md px-3 py-1.5 text-sm transition", !type ? "bg-ink text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}
        >
          全部
        </Link>
        {POST_TYPES.filter((p) => p.key !== "promo").map((item) => (
          <Link
            key={item.key}
            href={`/posts?type=${item.key}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition",
              type === item.key ? (item.key === "avoid" ? "bg-red-600 text-white" : "bg-accent text-white") : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            )}
          >
            {item.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-rose-400" /> 点赞
          </span>
          <span className="inline-flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5 text-blue-400" /> 收藏
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-400">
          还没有经验帖，成为第一个分享真实经历的人
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((post) => (
            <ExperiencePostCard
              key={post.id}
              id={post.id}
              title={post.title}
              content={post.content}
              postType={post.postType}
              merchantName={post.merchantName}
              images={JSON.parse(post.images) as string[]}
              likeCount={post.likeCount}
              favoriteCount={post.favoriteCount}
              status={post.status}
              createdAt={post.createdAt}
              school={post.school}
              major={post.major}
              author={post.author}
            />
          ))}
        </div>
      )}
    </div>
  );
}