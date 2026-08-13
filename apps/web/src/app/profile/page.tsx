import { redirect } from "next/navigation";
import Link from "next/link";
import { LEVELS, SCENARIO_LABEL } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { MyRepliesPicker } from "@/components/MyRepliesPicker";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [profile, questions, replies, posts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { starScore: true, level: true, verifiedSchools: true, bio: true, createdAt: true },
    }),
    prisma.question.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, starCount: true, replyCount: true, createdAt: true },
    }),
    prisma.reply.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        content: true,
        starCount: true,
        createdAt: true,
        questionId: true,
        question: { select: { title: true, scenarioType: true } },
      },
    }),
    prisma.aiPost.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, starCount: true, createdAt: true },
    }),
  ]);

  if (!profile) redirect("/login");
  const schools = safeParse<string[]>(profile.verifiedSchools, []);
  const current = LEVELS.find((l) => l.level === profile.level) ?? LEVELS[0];
  const next = LEVELS[profile.level + 1];
  const progress = next ? Math.min(100, Math.round(((profile.starScore - current.min) / (next.min - current.min)) * 100)) : 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-lg font-semibold text-white">
                {user.nickname.slice(0, 1)}
              </span>
              <div>
                <h1 className="text-lg font-semibold text-ink">{user.nickname}</h1>
                <p className="text-sm text-zinc-500">{profile.bio || "这个人很懒，还没有写简介"}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <VerifiedBadge schools={schools} />
              <span className="text-xs text-zinc-400">注册于 {formatRelative(profile.createdAt)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-ink">{profile.starScore}</p>
            <p className="text-xs text-zinc-400">star_score</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-600">{current.name}</span>
            <span className="text-zinc-400">{next ? `距 ${next.name} 还差 ${next.min - profile.starScore} 分` : "已达最高等级"}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-zinc-400">{current.reward}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">我的提问</h2>
        {questions.length === 0 ? (
          <p className="text-sm text-zinc-400">还没有提问</p>
        ) : (
          <div className="space-y-2">
            {questions.map((question) => (
              <Link key={question.id} href={`/question/${question.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{question.title}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {question.starCount} star · {question.replyCount} 回复 · {formatRelative(question.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">我的回复</h2>
        <p className="mb-3 text-xs text-zinc-400">勾选同类回复，AI 可跨问题整合成新精选帖</p>
        <MyRepliesPicker
          replies={replies.map((reply) => ({
            id: reply.id,
            content: reply.content,
            questionId: reply.questionId,
            questionTitle: reply.question.title,
            scenarioLabel:
              SCENARIO_LABEL[reply.question.scenarioType as keyof typeof SCENARIO_LABEL] ??
              reply.question.scenarioType,
            starCount: reply.starCount,
            createdAt: reply.createdAt.toISOString(),
          }))}
        />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">我的 AI 精选帖</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-zinc-400">还没有精选帖，L2 后可发布</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{post.title}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {post.starCount} star · {formatRelative(post.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
