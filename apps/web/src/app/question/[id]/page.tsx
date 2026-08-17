import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { SCENARIO_LABEL } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { StarButton } from "@/components/StarButton";
import { ReplyComposer } from "@/components/ReplyComposer";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { AiPostCreator } from "@/components/AiPostCreator";
import { VerifiedBadge } from "@/components/VerifiedBadge";

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
  let starred = new Set<string>();
  if (user) {
    const targetIds = [question.id, ...question.replies.map((reply) => reply.id)];
    const stars = await prisma.contentStar.findMany({
      where: { userId: user.id, targetId: { in: targetIds } },
      select: { targetType: true, targetId: true },
    });
    starred = new Set(stars.map((star) => `${star.targetType}:${star.targetId}`));
  }

  const authorSchools = safeParse<string[]>(question.author.verifiedSchools, []);
  const scenarioLabel = SCENARIO_LABEL[question.scenarioType as keyof typeof SCENARIO_LABEL] ?? question.scenarioType;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回发现页
      </Link>

      <section className="card p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-accent">{scenarioLabel}</span>
          {question.tags.map((item) => (
            <span key={item.tag.id} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
              {item.tag.name}
            </span>
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
        <div className="mt-3 border-t border-line pt-3">
          <StarButton
            endpoint={`/api/questions/${question.id}/star`}
            count={question.starCount}
            active={starred.has(`question:${question.id}`)}
            label="问题有帮助，点亮 star"
          />
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

      <AiPostCreator
        questionId={question.id}
        replies={question.replies.map((reply) => ({
          id: reply.id,
          author: reply.author.nickname,
          content: reply.content,
        }))}
      />

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">全部回复</h2>
        {question.replies.length === 0 ? (
          <p className="card p-6 text-center text-sm text-zinc-400">还没有回复，来当第一个分享的人</p>
        ) : (
          <div className="space-y-3">
            {question.replies.map((reply) => {
              const replySchools = safeParse<string[]>(reply.author.verifiedSchools, []);
              return (
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
                    <StarButton
                      endpoint={`/api/replies/${reply.id}/star`}
                      count={reply.starCount}
                      active={starred.has(`reply:${reply.id}`)}
                      label="这条回复有帮助"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ReplyComposer questionId={question.id} />
    </div>
  );
}
