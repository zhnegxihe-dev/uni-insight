import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CornerUpRight, Heart, ShieldAlert } from "lucide-react";
import { SCENARIO_LABEL } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { LikeButton } from "@/components/LikeButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReplyComposer } from "@/components/ReplyComposer";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ReportButton } from "@/components/ReportButton";
import { TrackView } from "@/components/TrackView";
import { tagsOfQuestion } from "@/lib/recommend";
import { RepliesPanel, type ReplyData } from "@/components/RepliesPanel";

export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      tags: { include: { tag: true } },
      aiSummary: true,
      replies: {
        include: { author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } } },
        orderBy: [{ starCount: "desc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!question) notFound();

  const user = await getSessionUser();

  const [schoolSlugs, majorSlugs, forkOrigin, derivedPosts, derivedQuestions] = await Promise.all([
    prisma.school.findMany({ select: { name: true, slug: true } }),
    prisma.major.findMany({ select: { name: true, slug: true } }),
    question.forkedFromQuestionId
      ? prisma.question.findUnique({
          where: { id: question.forkedFromQuestionId },
          select: { id: true, title: true, status: true },
        })
      : Promise.resolve(null),
    prisma.experiencePost.findMany({
      where: { sourceQuestionId: id, status: { not: "hidden" }, postType: { not: "promo" } },
      select: {
        id: true,
        title: true,
        postType: true,
        sourceReplyId: true,
        likeCount: true,
        favoriteCount: true,
        createdAt: true,
        author: { select: { nickname: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.question.findMany({
      where: { forkedFromQuestionId: id, status: { not: "hidden" } },
      select: {
        id: true,
        title: true,
        replyCount: true,
        starCount: true,
        createdAt: true,
        author: { select: { nickname: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);
  const schoolSlugByName = new Map(schoolSlugs.map((school) => [school.name, school.slug]));
  const majorSlugByName = new Map(majorSlugs.map((major) => [major.name, major.slug]));

  let starred = new Set<string>();
  let favorited = new Set<string>();
  if (user) {
    const [stars, favs] = await Promise.all([
      prisma.contentStar.findMany({
        where: { userId: user.id, targetId: { in: [question.id, ...question.replies.map((r) => r.id)] } },
        select: { targetType: true, targetId: true },
      }),
      prisma.contentFavorite.findMany({
        where: { userId: user.id, targetId: { in: [question.id, ...question.replies.map((r) => r.id)] } },
        select: { targetType: true, targetId: true },
      }),
    ]);
    starred = new Set(stars.map((star) => `${star.targetType}:${star.targetId}`));
    favorited = new Set(favs.map((fav) => `${fav.targetType}:${fav.targetId}`));
  }

  const authorSchools = safeParse<string[]>(question.author.verifiedSchools, []);
  const scenarioLabel = SCENARIO_LABEL[question.scenarioType as keyof typeof SCENARIO_LABEL] ?? question.scenarioType;
  const questionHidden = question.status === "hidden";
  const forkReplyIds = safeParse<string[]>(question.forkedFromReplyIds, []);

  const replyData: ReplyData[] = question.replies
    .filter((reply) => reply.status !== "hidden")
    .map((reply) => ({
      id: reply.id,
      content: reply.content,
      parentReplyId: reply.parentReplyId ?? null,
      status: reply.status,
      isAccepted: reply.isAccepted,
      starCount: reply.starCount,
      favoriteCount: reply.favoriteCount,
      createdAt: reply.createdAt.toISOString(),
      author: {
        id: reply.author.id,
        nickname: reply.author.nickname,
        level: reply.author.level,
        verifiedSchools: reply.author.verifiedSchools,
      },
    }));
  const starredReplyIds = [...starred].filter((k) => k.startsWith("reply:")).map((k) => k.slice(6));
  const favoritedReplyIds = [...favorited].filter((k) => k.startsWith("reply:")).map((k) => k.slice(6));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <TrackView actionType="view" targetType="question" targetId={question.id} tags={tagsOfQuestion(question)} />
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回发现页
      </Link>

      {question.status === "folded" && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          该问题因多次举报已被折叠，正在人工审核中。
        </div>
      )}

      {questionHidden && (
        <section className="card p-10 text-center">
          <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-400">该问题因被确认违规已被隐藏</p>
        </section>
      )}

      {!questionHidden && (
        <>
          {forkOrigin && forkOrigin.status !== "visible" ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-700">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>来源问题已被折叠或隐藏，本帖内容由作者后续创建。</span>
            </div>
          ) : forkOrigin ? (
            <div className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-zinc-600">
              <CornerUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span>
                本问题由一段讨论转来，转自
                <Link href={`/question/${forkOrigin.id}`} className="mx-1 font-medium text-accent hover:underline">
                  《{forkOrigin.title}》
                </Link>
                {forkReplyIds.length > 0 && `（引用 ${forkReplyIds.length} 条回复作为讨论起点）`}
              </span>
            </div>
          ) : null}

          <section className="card p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-accent">{scenarioLabel}</span>
              {question.tags.map((item) =>
                item.tag.type === "school" || item.tag.type === "major" ? (
                  schoolSlugByName.has(item.tag.name) || majorSlugByName.has(item.tag.name) ? (
                    <Link
                      key={item.tag.id}
                      href={item.tag.type === "school" ? `/school/${schoolSlugByName.get(item.tag.name)}` : `/major/${majorSlugByName.get(item.tag.name)}`}
                      className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 transition hover:bg-blue-50 hover:text-accent"
                    >
                      {item.tag.name}
                    </Link>
                  ) : (
                    <span key={item.tag.id} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                      {item.tag.name}
                    </span>
                  )
                ) : (
                  <span key={item.tag.id} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                    {item.tag.name}
                  </span>
                )
              )}
            </div>
            <h1 className="text-lg font-semibold leading-snug text-ink">{question.title}</h1>
            {question.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{question.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <Link href={`/user/${question.author.id}`} className="font-medium text-zinc-600 hover:text-accent">
                {question.author.nickname}
              </Link>
              <VerifiedBadge schools={authorSchools} />
              <span>L{question.author.level}</span>
              <span>{formatRelative(question.createdAt)}</span>
              <span className="ml-auto">{question.replyCount} 条回复</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <div className="flex items-center gap-2">
                <LikeButton endpoint={`/api/questions/${question.id}/star`} count={question.starCount} active={starred.has(`question:${question.id}`)} label="问题有帮助，点赞" />
                <FavoriteButton endpoint={`/api/questions/${question.id}/favorite`} count={question.favoriteCount} active={favorited.has(`question:${question.id}`)} label="收藏这个问题" />
              </div>
              <ReportButton targetType="question" targetId={question.id} />
            </div>
          </section>

          {question.aiSummary && (
            <AiSummaryCard
              summaryJson={question.aiSummary.summaryJson}
              sampleNote={question.aiSummary.sampleNote}
              confidence={question.aiSummary.confidence}
              locked={question.aiSummary.isLocked}
            />
          )}

          <RepliesPanel
            questionId={question.id}
            questionTitle={question.title}
            questionOwnerId={question.author.id}
            currentUserId={user?.id ?? null}
            scenarioType={question.scenarioType}
            replies={replyData}
            starredReplyIds={starredReplyIds}
            favoritedReplyIds={favoritedReplyIds}
          />

          {(derivedPosts.length > 0 || derivedQuestions.length > 0) && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-ink">衍生与相关</h2>
              <div className="space-y-2">
                {derivedQuestions.map((q) => (
                  <Link key={q.id} href={`/question/${q.id}`} className="card block p-4 transition hover:border-zinc-300">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">
                        <CornerUpRight className="h-3 w-3" />
                        转帖讨论
                      </span>
                      <span>{q.author.nickname}</span>
                      <span className="ml-auto">{q.replyCount} 回复 · {formatRelative(q.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-ink">{q.title}</p>
                  </Link>
                ))}
                {derivedPosts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`} className="card block p-4 transition hover:border-zinc-300">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 font-medium text-violet-600">
                        {post.postType === "avoid" ? "避雷帖" : "经验帖"}
                        {post.sourceReplyId && <Heart className="h-3 w-3 text-rose-400" />}
                      </span>
                      <span>{post.author.nickname}</span>
                      <span className="ml-auto">{post.likeCount} 赞 · {formatRelative(post.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-ink">{post.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <ReplyComposer questionId={question.id} />
        </>
      )}
    </div>
  );
}
