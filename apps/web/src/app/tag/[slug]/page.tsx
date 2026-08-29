import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Hash, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { QuestionCard } from "@/components/QuestionCard";

export const dynamic = "force-dynamic";

const TAG_TYPE_LABEL: Record<string, string> = {
  school: "学校",
  major: "专业",
  degree: "学位",
  scenario: "场景",
  region: "地区",
  industry: "行业",
  course: "课程",
  teacher: "教师",
  custom: "自定义",
};

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      questions: {
        include: {
          question: {
            include: {
              author: { select: { nickname: true, verifiedSchools: true, level: true } },
              tags: { include: { tag: { select: { id: true, name: true, slug: true, type: true } } } },
              aiSummary: { select: { id: true, confidence: true } },
            },
          },
        },
      },
    },
  });
  if (!tag) notFound();

  const questions = tag.questions
    .map((item) => item.question)
    .filter((question) => question.status !== "hidden")
    .sort((a, b) => b.starCount - a.starCount);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回发现页
      </Link>

      <section className="card p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-accent">
            <Hash className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">
                {TAG_TYPE_LABEL[tag.type] ?? tag.type}
              </span>
              <span>{questions.length} 个相关问题</span>
            </div>
            <h1 className="text-2xl font-semibold text-ink">{tag.name}</h1>
            {tag.description && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{tag.description}</p>}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-zinc-400" />
          <h2 className="text-base font-semibold text-ink">相关提问</h2>
        </div>
        {questions.length === 0 ? (
          <p className="card p-6 text-center text-sm text-zinc-400">这个标签下还没有问题</p>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                id={question.id}
                title={question.title}
                description={question.description}
                scenarioType={question.scenarioType}
                likeCount={question.starCount}
                favoriteCount={question.favoriteCount}
                replyCount={question.replyCount}
                createdAt={question.createdAt}
                hasSummary={Boolean(question.aiSummary)}
                folded={question.status === "folded"}
                tags={question.tags.map((item) => ({ id: item.tag.id, name: item.tag.name, slug: item.tag.slug, type: item.tag.type }))}
                author={question.author}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
