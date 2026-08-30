import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, ChevronLeft, Heart, ShieldAlert } from "lucide-react";
import { POST_TYPES, SCENARIO_LABEL } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { LikeButton } from "@/components/LikeButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReportButton } from "@/components/ReportButton";
import { ImageGallery } from "@/components/ImageGallery";
import { TrackView } from "@/components/TrackView";
import { tagsOfExperiencePost } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export default async function ExperiencePostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.experiencePost.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      school: { select: { id: true, name: true, slug: true } },
      major: { select: { id: true, name: true, slug: true } },
      course: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true, title: true } },
    },
  });
  if (!post) notFound();

  const user = await getSessionUser();
  let liked = false;
  let favorited = false;
  if (user) {
    const [like, fav] = await Promise.all([
      prisma.contentStar.findUnique({
        where: { userId_targetType_targetId: { userId: user.id, targetType: "experience_post", targetId: id } },
      }),
      prisma.contentFavorite.findUnique({
        where: { userId_targetType_targetId: { userId: user.id, targetType: "experience_post", targetId: id } },
      }),
    ]);
    liked = Boolean(like);
    favorited = Boolean(fav);
  }

  const hidden = post.status === "hidden";
  const folded = post.status === "folded";
  const typeMeta = POST_TYPES.find((p) => p.key === post.postType);
  const isAvoid = post.postType === "avoid";
  const isPromo = post.postType === "promo";
  const images = safeParse<string[]>(post.images, []);
  const schools = safeParse<string[]>(post.author.verifiedSchools, []);
  const scenarioLabel = post.scenarioType
    ? SCENARIO_LABEL[post.scenarioType as keyof typeof SCENARIO_LABEL] ?? post.scenarioType
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <TrackView actionType="view" targetType="experience_post" targetId={post.id} tags={tagsOfExperiencePost(post)} />
      <Link href="/posts" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回经验帖
      </Link>

      {folded && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          该帖因多次举报已被折叠，正在人工审核中。
        </div>
      )}

      {hidden ? (
        <section className="card p-10 text-center">
          <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-400">该帖因被确认违规已被隐藏</p>
        </section>
      ) : (
        <section className="card p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={isAvoid ? "rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600" : isPromo ? "rounded bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white" : "rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-accent"}>
              {typeMeta?.label ?? post.postType}
              {isPromo && post.merchantName ? ` · ${post.merchantName}` : ""}
            </span>
            {scenarioLabel && <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-600">{scenarioLabel}</span>}
          </div>
          {isPromo && (
            <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              受商家委托的推广内容，已明示标注为「推广帖」并带商户名角标，不进入信任流推荐。内容仍接受点赞、收藏与评论区监督。
            </div>
          )}
          <h1 className="text-lg font-semibold leading-snug text-ink">{post.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
            {(post.school || post.major || post.course || post.teacher) && (
              <>
                {post.school && (
                  <Link href={`/school/${post.school.slug}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 transition hover:bg-blue-50 hover:text-accent">
                    学校：{post.school.name}
                  </Link>
                )}
                {post.major && (
                  <Link href={`/major/${post.major.slug}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 transition hover:bg-blue-50 hover:text-accent">
                    专业：{post.major.name}
                  </Link>
                )}
                {post.course && (
                  <Link href={`/course/${post.course.id}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 transition hover:bg-blue-50 hover:text-accent">
                    课程：{post.course.name}
                  </Link>
                )}
                {post.teacher && (
                  <Link href={`/teacher/${post.teacher.id}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 transition hover:bg-blue-50 hover:text-accent">
                    教师：{post.teacher.name}
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
            <span className="font-medium text-zinc-600">{post.author.nickname}</span>
            <VerifiedBadge schools={schools} />
            <span>L{post.author.level}</span>
            <span>{formatRelative(post.createdAt)}</span>
          </div>

          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{post.content}</div>

          <ImageGallery images={images} />

          <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
            <div className="flex items-center gap-2">
              <LikeButton endpoint={`/api/posts/${post.id}/like`} count={post.likeCount} active={liked} label="这篇经验有帮助" />
              <FavoriteButton endpoint={`/api/posts/${post.id}/favorite`} count={post.favoriteCount} active={favorited} label="收藏这篇经验帖" />
              <span className="ml-1 hidden items-center gap-1 text-xs text-zinc-400 sm:inline-flex">
                <Heart className="h-3.5 w-3.5 text-rose-400" /> 点赞 · <Bookmark className="h-3.5 w-3.5 text-blue-400" /> 收藏
              </span>
            </div>
            <ReportButton targetType="experience_post" targetId={post.id} />
          </div>
        </section>
      )}
    </div>
  );
}