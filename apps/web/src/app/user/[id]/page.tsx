import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageSquare, Sparkles, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { isFollowing, isMutual } from "@/lib/social";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FollowButton } from "@/components/FollowButton";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();

  const profile = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nickname: true,
      bio: true,
      verifiedSchools: true,
      level: true,
      starScore: true,
      createdAt: true,
    },
  });
  if (!profile) notFound();

  const [questions, replies, posts, experiencePosts, followerCount, followingCount] = await Promise.all([
    prisma.question.findMany({
      where: { authorId: id, status: { not: "hidden" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, starCount: true, favoriteCount: true, replyCount: true, scenarioType: true, createdAt: true },
    }),
    prisma.reply.findMany({
      where: { authorId: id, status: { not: "hidden" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, content: true, starCount: true, createdAt: true, questionId: true, question: { select: { title: true } } },
    }),
    prisma.aiPost.findMany({
      where: { authorId: id, status: { notIn: ["hidden", "rejected"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, starCount: true, favoriteCount: true, createdAt: true },
    }),
    prisma.experiencePost.findMany({
      where: { authorId: id, status: { not: "hidden" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, postType: true, likeCount: true, favoriteCount: true, createdAt: true },
    }),
    prisma.follow.count({ where: { followingId: id } }),
    prisma.follow.count({ where: { followerId: id } }),
  ]);

  const schools = safeParse<string[]>(profile.verifiedSchools, []);
  const isSelf = user?.id === id;
  const following = user ? await isFollowing(user.id, id) : false;
  const mutual = user ? await isMutual(user.id, id) : false;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回发现页
      </Link>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-xl font-semibold text-white">
              {profile.nickname.slice(0, 1)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-ink">{profile.nickname}</h1>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600">L{profile.level}</span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">{profile.bio || "这个人很懒，还没有写简介"}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <VerifiedBadge schools={schools} />
                <span className="text-xs text-zinc-400">{profile.starScore} star</span>
                <span className="text-xs text-zinc-400">注册于 {formatRelative(profile.createdAt)}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                <span>
                  <span className="font-semibold text-ink">{followingCount}</span> 关注
                </span>
                <span>
                  <span className="font-semibold text-ink">{followerCount}</span> 粉丝
                </span>
                {mutual && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-accent">互相关注</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {!isSelf && user && <FollowButton userId={profile.id} following={following} followers={followerCount} />}
            {!isSelf && (
              <Link
                href={`/messages/new?to=${profile.id}`}
                className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                发消息
              </Link>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">TA 的提问</h2>
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
        <h2 className="mb-3 text-base font-semibold text-ink">TA 的回复</h2>
        {replies.length === 0 ? (
          <p className="text-sm text-zinc-400">还没有回复</p>
        ) : (
          <div className="space-y-2">
            {replies.map((reply) => (
              <Link key={reply.id} href={`/question/${reply.questionId}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm leading-relaxed text-ink">{reply.content}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  回复「{reply.question.title}」 · {reply.starCount} star · {formatRelative(reply.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">TA 的 AI 精选帖</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-zinc-400">还没有精选帖</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  {post.title}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {post.starCount} 点赞 · {post.favoriteCount} 收藏 · {formatRelative(post.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">TA 的经验帖 / 避雷帖</h2>
        {experiencePosts.length === 0 ? (
          <p className="text-sm text-zinc-400">还没有经验帖</p>
        ) : (
          <div className="space-y-2">
            {experiencePosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{post.title}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {post.postType === "avoid" ? "避雷帖" : "经验帖"} · {post.likeCount} 点赞 · {post.favoriteCount} 收藏 · {formatRelative(post.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
