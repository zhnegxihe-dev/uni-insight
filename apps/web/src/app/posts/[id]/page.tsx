import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, ChevronLeft, CornerUpRight, Heart, ShieldAlert } from "lucide-react";
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
import { ShareCardButton } from "@/components/ShareCardButton";

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
      merchant: { select: { id: true, name: true, tier: true, category: true } },
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

  let source: {
    questionId: string;
    questionTitle: string;
    replyAuthorName: string;
    replyAuthorId: string;
    replySnippet: string;
    degraded: boolean;
    isQuote: boolean;
  } | null = null;
  if (post.sourceReplyId && post.sourceQuestionId) {
    const [sr, sq] = await Promise.all([
      prisma.reply.findUnique({
        where: { id: post.sourceReplyId },
        select: { content: true, status: true, author: { select: { id: true, nickname: true } } },
      }),
      prisma.question.findUnique({ where: { id: post.sourceQuestionId }, select: { title: true } }),
    ]);
    if (sr && sq) {
      const degraded = sr.status !== "visible";
      source = {
        questionId: post.sourceQuestionId,
        questionTitle: sq.title,
        replyAuthorName: sr.author.nickname,
        replyAuthorId: sr.author.id,
        replySnippet: degraded ? "" : sr.content.length > 60 ? sr.content.slice(0, 60) + "…" : sr.content,
        degraded,
        isQuote: sr.author.id !== post.authorId,
      };
    }
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

  const sourceText = source && !source.degraded
    ? `${source.isQuote ? "引用了" : "由"} @${source.replyAuthorName} 的回复 · 转自《${source.questionTitle}》`
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
            {isPromo && post.merchant ? (
              <Link
                href={`/merchant/${post.merchant.id}`}
                className="rounded bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white transition hover:bg-blue-700"
                title="查看该商户主页（聚合全部推广与评价）"
              >
                {typeMeta?.label ?? post.postType} · {post.merchant.name}
              </Link>
            ) : (
              <span className={isAvoid ? "rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600" : isPromo ? "rounded bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white" : "rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-accent"}>
                {typeMeta?.label ?? post.postType}
                {isPromo && post.merchantName ? ` · ${post.merchantName}` : ""}
              </span>
            )}
            {scenarioLabel && <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-600">{scenarioLabel}</span>}
          </div>

          {source && source.degraded && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-700">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                来源回复已被折叠或隐藏（原文不再展示），本帖为作者后续创作的内容。
                {source.questionId && (
                  <Link href={`/question/${source.questionId}`} className="ml-1 font-medium underline">
                    查看原问题
                  </Link>
                )}
              </span>
            </div>
          )}

          {source && !source.degraded && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-zinc-600">
              <CornerUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span>
                本帖{source.isQuote ? "引用" : "由"} <span className="font-medium text-zinc-700">@{source.replyAuthorName}</span> 的回复
                {source.isQuote ? "展开创作而来，转自" : "升级而来，转自"}
                <Link href={`/question/${source.questionId}`} className="mx-1 font-medium text-accent hover:underline">
                  《{source.questionTitle}》
                </Link>
                {source.isQuote ? "，原回复作者会收到通知。" : "，原文回复仍保留在原问题下。"}
                {!source.isQuote && ` 回复：「${source.replySnippet}」`}
              </span>
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <div className="flex items-center gap-2">
              <LikeButton endpoint={`/api/posts/${post.id}/like`} count={post.likeCount} active={liked} label="这篇经验有帮助" />
              <FavoriteButton endpoint={`/api/posts/${post.id}/favorite`} count={post.favoriteCount} active={favorited} label="收藏这篇经验帖" />
              <span className="ml-1 hidden items-center gap-1 text-xs text-zinc-400 sm:inline-flex">
                <Heart className="h-3.5 w-3.5 text-rose-400" /> 点赞 · <Bookmark className="h-3.5 w-3.5 text-blue-400" /> 收藏
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShareCardButton
                id={post.id}
                kind="post"
                title={post.title}
                content={post.content}
                typeLabel={typeMeta?.label ?? post.postType}
                authorName={post.author.nickname}
                authorBadge={schools[0]}
                sourceText={sourceText}
                accent={isAvoid ? "red" : "blue"}
              />
              <ReportButton targetType="experience_post" targetId={post.id} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
