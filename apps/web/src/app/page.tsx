import type { Prisma } from "@prisma/client";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getRecommendations, hotScore } from "@/lib/recommend";
import { ScenarioTabs } from "@/components/ScenarioTabs";
import { QuestionCard } from "@/components/QuestionCard";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; q?: string }>;
}) {
  const params = await searchParams;
  const scenario = params.scenario ?? "all";
  const q = params.q?.trim();

  const where: Prisma.QuestionWhereInput = { status: { not: "hidden" } };
  if (scenario !== "all") where.scenarioType = scenario;
  if (q) {
    where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
  }

  const user = await getSessionUser();
  const [questions, recResult] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        author: { select: { nickname: true, verifiedSchools: true, level: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        aiSummary: { select: { id: true, confidence: true } },
      },
      take: 60,
    }),
    user
      ? getRecommendations(user.id, 6)
      : Promise.resolve({ items: [], hasProfile: false, reason: null, userVector: {} }),
  ]);

  // 各栏目内按热门推荐算法排序（star/回复加权 + 时间衰减），热门内容优先
  const sortedQuestions = [...questions].sort((a, b) => hotScore(b) - hotScore(a));

  const renderCard = (question: (typeof questions)[number], keyPrefix: string) => (
    <QuestionCard
      key={`${keyPrefix}-${question.id}`}
      id={question.id}
      title={question.title}
      description={question.description}
      scenarioType={question.scenarioType}
      starCount={question.starCount}
      replyCount={question.replyCount}
      createdAt={question.createdAt}
      hasSummary={Boolean(question.aiSummary)}
      folded={question.status === "folded"}
      tags={question.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, slug: t.tag.slug }))}
      author={question.author}
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">发现</h1>
        <p className="mt-1 text-sm text-zinc-500">真实学长学姐的经验，点亮 star 让好内容被看见</p>
      </div>

      {recResult.hasProfile && recResult.items.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-base font-semibold text-ink">为你推荐</h2>
            {recResult.reason && (
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-accent">{recResult.reason}</span>
            )}
          </div>
          <div className="space-y-3">
            {recResult.items.map(({ question }) => renderCard(question, "rec"))}
          </div>
        </section>
      )}

      <section>
        <ScenarioTabs current={scenario} />
        {sortedQuestions.length === 0 ? (
          <div className="card p-10 text-center text-sm text-zinc-400">
            {scenario === "all" ? "还没有相关问题，成为第一个提问的人" : "该场景下还没有问题"}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedQuestions.map((question) => renderCard(question, "feed"))}
          </div>
        )}
      </section>
    </div>
  );
}
