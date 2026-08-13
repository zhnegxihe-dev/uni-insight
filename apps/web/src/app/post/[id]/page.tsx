import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageSquare, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { StarButton } from "@/components/StarButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.aiPost.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
    },
  });
  if (!post) notFound();

  const user = await getSessionUser();
  let active = false;
  if (user) {
    const star = await prisma.contentStar.findUnique({
      where: { userId_targetType_targetId: { userId: user.id, targetType: "ai_post", targetId: post.id } },
    });
    active = Boolean(star);
  }

  const summary = safeParse<Record<string, unknown>>(post.summaryJson, {});
  const sourceIds = safeParse<string[]>(post.selectedReplyIds, []);
  const sources = sourceIds.length
    ? await prisma.reply.findMany({
        where: { id: { in: sourceIds } },
        include: {
          author: { select: { nickname: true, verifiedSchools: true } },
          question: { select: { id: true, title: true } },
        },
      })
    : [];
  const sourceQuestions = new Map(sources.map((source) => [source.question.id, source.question.title]));
  const schools = safeParse<string[]>(post.author.verifiedSchools, []);

  const sections = [
    ["overview", "总体评价", summary.overview],
    ["curriculum_insight", "课程内容", summary.curriculum_insight],
    ["job_prospect", "就业真实情况", summary.job_prospect],
    ["industry_outlook", "行业环境", summary.industry_outlook],
    ["advisor_insight", "导师洞察", summary.advisor_insight],
    ["advice", "学长学姐建议", summary.advice],
  ].filter(([, , value]) => value) as [string, string, string][];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回发现页
      </Link>

      <section className="card p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium text-accent">AI 精选帖</span>
          {post.isHumanEdited && <span className="text-xs text-zinc-400">作者已编辑</span>}
        </div>
        <h1 className="text-lg font-semibold leading-snug text-ink">{post.title}</h1>
        {sourceQuestions.size > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {sourceQuestions.size > 1 && (
              <span className="rounded bg-ink px-1.5 py-0.5 text-[11px] font-medium text-white">跨问题整合</span>
            )}
            {Array.from(sourceQuestions.entries())
              .slice(0, 5)
              .map(([questionId, questionTitle]) => (
                <Link
                  key={questionId}
                  href={`/question/${questionId}`}
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-1 text-xs text-accent transition-colors hover:bg-blue-50"
                >
                  <MessageSquare className="h-3 w-3" />
                  {questionTitle}
                </Link>
              ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-600">{post.author.nickname}</span>
          <VerifiedBadge schools={schools} />
          <span>{post.publishedAt ? formatRelative(post.publishedAt) : formatRelative(post.createdAt)}</span>
          <span className="ml-auto">{post.sourceCount} 条引用来源</span>
        </div>
        <div className="mt-3 border-t border-line pt-3">
          <StarButton endpoint={`/api/ai-posts/${post.id}/star`} count={post.starCount} active={active} label="这篇精选帖有帮助" />
        </div>
      </section>

      <section className="card space-y-4 p-6">
        {sections.map(([key, label, value]) => (
          <div key={key}>
            <h2 className="mb-1 text-sm font-semibold text-zinc-500">{label}</h2>
            {Array.isArray(summary[key]) ? (
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink">
                {(summary[key] as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-ink">{value}</p>
            )}
          </div>
        ))}
        <p className="border-t border-line pt-3 text-xs text-zinc-400">
          {String(summary.sample_note ?? "")}
          {" · "}AI 仅整理学生观点，不构成官方信息。
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">引用来源</h2>
        <div className="space-y-2">
          {sources.length === 0 ? (
            <p className="text-sm text-zinc-400">暂无来源</p>
          ) : (
            sources.map((source) => {
              const sourceSchools = safeParse<string[]>(source.author.verifiedSchools, []);
              return (
                <div key={source.id} className="card px-4 py-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-600">{source.author.nickname}</span>
                    <VerifiedBadge schools={sourceSchools} />
                    <span>{formatRelative(source.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink">{source.content}</p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
