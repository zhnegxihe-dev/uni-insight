import { redirect } from "next/navigation";
import Link from "next/link";
import { LEVELS, SCENARIO_LABEL } from "@/lib/core";
import { BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { MyRepliesPicker } from "@/components/MyRepliesPicker";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [profile, questions, replies, posts, experiencePosts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { starScore: true, level: true, verifiedSchools: true, bio: true, createdAt: true },
    }),
    prisma.question.findMany({
      where: { authorId: user.id, status: { not: "hidden" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, starCount: true, favoriteCount: true, replyCount: true, createdAt: true },
    }),
    prisma.reply.findMany({
      where: { authorId: user.id, status: { not: "hidden" } },
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
      where: { authorId: user.id, status: { notIn: ["hidden", "rejected"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, starCount: true, favoriteCount: true, createdAt: true },
    }),
    prisma.experiencePost.findMany({
      where: { authorId: user.id, status: { not: "hidden" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, postType: true, likeCount: true, favoriteCount: true, createdAt: true },
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <VerifiedBadge schools={schools} />
              {user.trustScore >= 20 && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700" title="诚信分 {user.trustScore}">
                  透明分享者
                </span>
              )}
              <span className="text-xs text-zinc-400">注册于 {formatRelative(profile.createdAt)}</span>
            </div>
            {schools.length === 0 && (
              <Link
                href="/settings"
                className="mt-3 inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                去认证学校邮箱，+20 积分
              </Link>
            )}
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
                  {question.starCount} 点赞 · {question.favoriteCount} 收藏 · {question.replyCount} 回复 · {formatRelative(question.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-ink">AI 精选帖创作</h2>
        <p className="mb-3 text-xs text-zinc-400">
          从你的历史回答中勾选至少 3 条相似回复，AI 会整合成一篇新帖子直接发布（需 L2 及以上）。
        </p>
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
                  {post.starCount} 点赞 · {post.favoriteCount} 收藏 · {formatRelative(post.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">我的经验帖 / 避雷帖</h2>
        {experiencePosts.length === 0 ? (
          <p className="text-sm text-zinc-400">
            还没有经验帖，<Link href="/posts/new" className="text-accent hover:underline">去写一篇</Link>，分享真实经历或踩过的坑
          </p>
        ) : (
          <div className="space-y-2">
            {experiencePosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{post.title}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {post.postType === "avoid" ? "避雷帖" : post.postType === "promo" ? "推广帖" : "经验帖"} · {post.likeCount} 点赞 · {post.favoriteCount} 收藏 · {formatRelative(post.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
