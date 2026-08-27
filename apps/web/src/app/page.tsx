import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getRecommendations, hotScore, hotScorePost } from "@/lib/recommend";
import { ScenarioTabs } from "@/components/ScenarioTabs";
import { QuestionCard } from "@/components/QuestionCard";
import { ExperiencePostCard } from "@/components/ExperiencePostCard";

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
  const [questions, recResult, experiencePosts] = await Promise.all([
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
    prisma.experiencePost.findMany({
      where: { status: { not: "hidden" } },
      include: {
        author: { select: { nickname: true, verifiedSchools: true, level: true } },
        school: { select: { id: true, name: true, slug: true } },
        major: { select: { id: true, name: true, slug: true } },
      },
      take: 20,
    }),
  ]);

  // 各栏目内按热门推荐算法排序（点赞/回复加权 + 时间衰减），热门内容优先
  const sortedQuestions = [...questions].sort((a, b) => hotScore(b) - hotScore(a));
  const sortedPosts = [...experiencePosts].sort((a, b) => hotScorePost(b) - hotScorePost(a)).slice(0, 3);

  const renderCard = (question: (typeof questions)[number], keyPrefix: string) => (
    <QuestionCard
      key={`${keyPrefix}-${question.id}`}
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
      tags={question.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, slug: t.tag.slug }))}
      author={question.author}
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">发现</h1>
        <p className="mt-1 text-sm text-zinc-500">真实学长学姐的经验，点赞让好内容被看见，收藏留住有用信息</p>
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

      {sortedPosts.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold text-ink">最新经验帖</h2>
            </div>
            <Link href="/posts" className="text-sm text-accent hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {sortedPosts.map((post) => (
              <ExperiencePostCard
                key={post.id}
                id={post.id}
                title={post.title}
                content={post.content}
                postType={post.postType}
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