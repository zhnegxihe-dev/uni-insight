import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { FollowButton, VerifiedBadge } from "../components";

export default function User() {
  const { id } = useParams();
  const state = useDb();
  const user = db.getCurrentUser(state);
  const profile = state.users.find((u) => u.id === id);
  if (!profile) return <div className="card p-10 text-center text-sm text-zinc-400">用户不存在</div>;

  const schools = JSON.parse(profile.verifiedSchools || "[]");
  const isSelf = user?.id === profile.id;
  const mutual = user ? db.isMutual(state, user.id, profile.id) : false;
  const questions = state.questions.filter((q) => q.authorId === profile.id && q.status !== "hidden").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  const replies = state.replies.filter((r) => r.authorId === profile.id && r.status !== "hidden").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  const experiencePosts = state.experiencePosts.filter((p) => p.authorId === profile.id && p.status !== "hidden").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />返回发现页
      </Link>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-xl font-semibold text-white">{profile.nickname.slice(0, 1)}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-ink">{profile.nickname}</h1>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600">L{profile.level}</span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">{profile.bio || "这个人很懒，还没有写简介"}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <VerifiedBadge schools={schools} />
                <span className="text-xs text-zinc-400">{profile.starScore} star</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                <span><span className="font-semibold text-ink">{db.followingCount(state, profile.id)}</span> 关注</span>
                <span><span className="font-semibold text-ink">{db.followerCount(state, profile.id)}</span> 粉丝</span>
                {mutual && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-accent">互相关注</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {!isSelf && user && <FollowButton userId={profile.id} />}
            {!isSelf && (
              <Link
                to={`/messages?to=${profile.id}`}
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
        {questions.length === 0 ? <p className="text-sm text-zinc-400">还没有提问</p> : (
          <div className="space-y-2">
            {questions.map((q) => (
              <Link key={q.id} to={`/question/${q.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{q.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{db.starCountFor(state, "question", q.id)} 点赞 · {db.favoriteCountFor(state, "question", q.id)} 收藏 · {q.replyCount} 回复 · {db.formatRelative(q.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">TA 的回复</h2>
        {replies.length === 0 ? <p className="text-sm text-zinc-400">还没有回复</p> : (
          <div className="space-y-2">
            {replies.map((r) => {
              const q = state.questions.find((x) => x.id === r.questionId);
              return (
                <Link key={r.id} to={`/question/${r.questionId}`} className="card block px-4 py-3 hover:border-zinc-300">
                  <p className="text-sm leading-relaxed text-ink">{r.content}</p>
                  <p className="mt-1 text-xs text-zinc-400">回复「{q?.title ?? ""}」 · {db.starCountFor(state, "reply", r.id)} 点赞 · {db.favoriteCountFor(state, "reply", r.id)} 收藏 · {db.formatRelative(r.createdAt)}</p>
                </Link>
              );
            })}
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
              <Link key={post.id} to={`/posts/${post.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{post.title}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {post.postType === "avoid" ? "避雷帖" : "经验帖"} · {db.starCountFor(state, "experience_post", post.id)} 点赞 · {db.favoriteCountFor(state, "experience_post", post.id)} 收藏 · {db.formatRelative(post.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}