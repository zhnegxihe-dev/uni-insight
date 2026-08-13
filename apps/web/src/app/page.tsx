import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

  const where: Prisma.QuestionWhereInput = {};
  if (scenario !== "all") where.scenarioType = scenario;
  if (q) {
    where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
  }

  const questions = await prisma.question.findMany({
    where,
    include: {
      author: { select: { nickname: true, verifiedSchools: true, level: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
      aiSummary: { select: { id: true, confidence: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">发现</h1>
        <p className="mt-1 text-sm text-zinc-500">真实学长学姐的经验，点亮 star 让好内容被看见</p>
      </div>
      <ScenarioTabs current={scenario} />
      {questions.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-400">还没有相关问题，成为第一个提问的人</div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              id={question.id}
              title={question.title}
              description={question.description}
              scenarioType={question.scenarioType}
              starCount={question.starCount}
              replyCount={question.replyCount}
              createdAt={question.createdAt}
              hasSummary={Boolean(question.aiSummary)}
              tags={question.tags.map((t) => ({ id: t.tag.id, name: t.tag.name }))}
              author={question.author}
            />
          ))}
        </div>
      )}
    </div>
  );
}
