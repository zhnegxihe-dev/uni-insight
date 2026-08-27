import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, ShieldAlert } from "lucide-react";
import { SCENARIO_LABEL } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { LikeButton } from "@/components/LikeButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReplyComposer } from "@/components/ReplyComposer";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AcceptButton } from "@/components/AcceptButton";
import { ReportButton } from "@/components/ReportButton";
import { TrackView } from "@/components/TrackView";
import { tagsOfQuestion } from "@/lib/recommend";
import { FoldedContent } from "@/components/FoldedContent";

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
  const [schoolSlugs, majorSlugs] = await Promise.all([
    prisma.school.findMany({ select: { name: true, slug: true } }),
    prisma.major.findMany({ select: { name: true, slug: true } }),
  ]);
  const schoolSlugByName = new Map(schoolSlugs.map((school) => [school.name, school.slug]));
  const majorSlugByName = new Map(majorSlugs.map((major) => [major.name, major.slug]));
  let starred = new Set<string>();
  let favorited = new Set<string>();
  if (user) {
    const targetIds = [question.id, ...question.replies.map((reply) => reply.id)];
    const [stars, favs] = await Promise.all([
      prisma.contentStar.findMany({
        where: { userId: user.id, targetId: { in: targetIds } },
        select: { targetType: true, targetId: true },
      }),
      prisma.contentFavorite.findMany({
        where: { userId: user.id, targetId: { in: targetIds } },
        select: { targetType: true, targetId: true },
      }),
    ]);
    starred = new Set(stars.map((star) => `${star.targetType}:${star.targetId}`));
    favorited = new Set(favs.map((fav) => `${fav.targetType}:${fav.targetId}`));
  }

  const authorSchools = safeParse<string[]>(question.author.verifiedSchools, []);
  const scenarioLabel = SCENARIO_LABEL[question.scenarioType as keyof typeof SCENARIO_LABEL] ?? question.scenarioType;
  const visibleReplies = question.replies.filter((reply) => reply.status !== "hidden");
  const questionHidden = question.status === "hidden";

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

      {!questionHidden && (
        <section className="card p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-accent">{scenarioLabel}</span>
            {question.tags.map((item) => (
              item.tag.type === "school" || item.tag.type === "major" ? (
                schoolSlugByName.has(item.tag.name) || majorSlugByName.has(item.tag.name) ? (
                  <Link
                    key={item.tag.id}
                    href={
                      item.tag.type === "school"
                        ? `/school/${schoolSlugByName.get(item.tag.name)}`
                        : `/major/${majorSlugByName.get(item.tag.name)}`
                    }
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
                <Link
                  key={item.tag.id}
                  href={`/tag/${item.tag.slug}`}
                  className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 transition hover:bg-blue-50 hover:text-accent"
                >
                  {item.tag.name}
                </Link>
              )
            ))}
          </div>
          <h1 className="text-lg font-semibold leading-snug text-ink">{question.title}</h1>
          {question.description && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{question.description}</p>}
          <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
            <span className="font-medium text-zinc-600">{question.author.nickname}</span>
            <VerifiedBadge schools={authorSchools} />
            <span>{formatRelative(question.createdAt)}</span>
            <span className="ml-auto">{question.replyCount} 条回复</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <div className="flex items-center gap-2">
              <LikeButton
                endpoint={`/api/questions/${question.id}/star`}
                count={question.starCount}
                active={starred.has(`question:${question.id}`)}
                label="问题有帮助，点赞"
              />
              <FavoriteButton
                endpoint={`/api/questions/${question.id}/favorite`}
                count={question.favoriteCount}
                active={favorited.has(`question:${question.id}`)}
                label="收藏这个问题"
              />
            </div>
            <ReportButton targetType="question" targetId={question.id} />
          </div>
        </section>
      )}

      {questionHidden && (
        <section className="card p-10 text-center">
          <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-400">该问题因被确认违规已被隐藏</p>
        </section>
      )}

      {question.aiSummary && !questionHidden && (
        <AiSummaryCard
          summaryJson={question.aiSummary.summaryJson}
          sampleNote={question.aiSummary.sampleNote}
          confidence={question.aiSummary.confidence}
          locked={question.aiSummary.isLocked}
        />
      )}

      {!questionHidden && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">全部回复</h2>
          {visibleReplies.length === 0 ? (
            <p className="card p-6 text-center text-sm text-zinc-400">还没有回复，来当第一个分享的人</p>
          ) : (
            <div className="space-y-3">
              {visibleReplies.map((reply) => {
                const replySchools = safeParse<string[]>(reply.author.verifiedSchools, []);
                const folded = reply.status === "folded";
                const body = (
                  <article key={reply.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500">
                          <span className="font-medium text-zinc-600">{reply.author.nickname}</span>
                          <VerifiedBadge schools={replySchools} />
                          <span>L{reply.author.level}</span>
                          {reply.isAccepted && (
                            <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              最有用
                            </span>
                          )}
                          <span className="ml-auto">{formatRelative(reply.createdAt)}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-ink">{reply.content}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <AcceptButton
                          replyId={reply.id}
                          accepted={reply.isAccepted}
                          canAccept={user?.id === question.author.id}
                        />
                        <div className="flex items-center gap-1.5">
                          <LikeButton
                            endpoint={`/api/replies/${reply.id}/star`}
                            count={reply.starCount}
                            active={starred.has(`reply:${reply.id}`)}
                            label="这条回复有帮助"
                          />
                          <FavoriteButton
                            endpoint={`/api/replies/${reply.id}/favorite`}
                            count={reply.favoriteCount}
                            active={favorited.has(`reply:${reply.id}`)}
                            label="收藏这条回复"
                          />
                        </div>
                        <ReportButton targetType="reply" targetId={reply.id} compact />
                      </div>
                    </div>
                  </article>
                );
                return folded ? (
                  <FoldedContent key={reply.id}>{body}</FoldedContent>
                ) : (
                  body
                );
              })}
            </div>
          )}
        </section>
      )}

      {!questionHidden && <ReplyComposer questionId={question.id} />}
    </div>
  );
}
