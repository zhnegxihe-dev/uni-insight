import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { QuestionCard } from "@/components/QuestionCard";
import { ExperiencePostCard } from "@/components/ExperiencePostCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const dynamic = "force-dynamic";

export default async function FollowingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: {
      following: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const followingIds = follows.map((f) => f.following.id);

  const questions = followingIds.length
    ? await prisma.question.findMany({
        where: { authorId: { in: followingIds }, status: { not: "hidden" } },
        include: {
          author: { select: { nickname: true, verifiedSchools: true, level: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
          aiSummary: { select: { id: true, confidence: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    : [];

  const experiencePosts = followingIds.length
    ? await prisma.experiencePost.findMany({
        where: { authorId: { in: followingIds }, status: { not: "hidden" } },
        include: {
          author: { select: { nickname: true, verifiedSchools: true, level: true } },
          school: { select: { id: true, name: true, slug: true } },
          major: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回发现页
      </Link>

      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-accent" />
        <h1 className="text-lg font-semibold text-ink">我关注的人</h1>
        <span className="text-xs text-zinc-400">{follows.length} 人</span>
      </div>

      {follows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-zinc-400">你还没有关注任何人。去用户主页关注感兴趣的学长学姐，跟进他们的最新提问</p>
        </div>
      ) : (
        <>
          <section className="card p-4">
            <div className="flex flex-wrap gap-2">
              {follows.map(({ following }) => {
                const schools = safeParse<string[]>(following.verifiedSchools, []);
                return (
                  <Link
                    key={following.id}
                    href={`/user/${following.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-blue-50 hover:text-accent"
                  >
                    {following.nickname}
                    <VerifiedBadge schools={schools} />
                  </Link>
                );
              })}
            </div>
          </section>

          {experiencePosts.length > 0 && (
            <section>
              <h2 className="mb-3 mt-6 text-base font-semibold text-ink">TA 们的最新经验帖</h2>
              <div className="space-y-3">
                {experiencePosts.map((post) => (
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
            <h2 className="mb-3 text-base font-semibold text-ink">TA 们的最新提问</h2>
            {questions.length === 0 ? (
              <p className="text-sm text-zinc-400">关注的人还没有新提问</p>
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
                    tags={question.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, slug: t.tag.slug }))}
                    author={question.author}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
