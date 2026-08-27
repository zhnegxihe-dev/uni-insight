import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Eye, Flag } from "lucide-react";
import { useDb, act } from "../store";
import * as db from "../db";
import { LikeButton, FavoriteButton, VerifiedBadge } from "../components";

function ReplyItem({ reply, question, canAccept }) {
  const state = useDb();
  const [foldedOpen, setFoldedOpen] = useState(false);
  const schools = JSON.parse(reply.author?.verifiedSchools || "[]");
  const body = (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500">
            <Link to={`/user/${reply.author?.id}`} className="font-medium text-zinc-600 hover:text-accent">{reply.author?.nickname}</Link>
            <VerifiedBadge schools={schools} />
            <span>L{reply.author?.level}</span>
            {reply.isAccepted && (
              <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />最有用
              </span>
            )}
            <span className="ml-auto">{db.formatRelative(reply.createdAt)}</span>
          </div>
          <p className="text-sm leading-relaxed text-ink">{reply.content}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {canAccept && !reply.isAccepted && (
            <button
              type="button"
              onClick={() => {
                act((s) => {
                  for (const r of s.replies) if (r.questionId === question.id) r.isAccepted = false;
                  const target = s.replies.find((r) => r.id === reply.id);
                  if (target) target.isAccepted = true;
                  s.questions.find((q) => q.id === question.id).acceptedReplyId = reply.id;
                  if (question.authorId !== reply.authorId) {
                    db.notify(s, reply.authorId, "accept", { type: "accept", actorId: question.authorId, questionId: question.id, questionTitle: question.title });
                  }
                });
              }}
              className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100"
            >
              采纳
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <LikeButton targetType="reply" targetId={reply.id} label="这条回复有帮助" />
            <FavoriteButton targetType="reply" targetId={reply.id} label="收藏这条回复" />
          </div>
        </div>
      </div>
    </article>
  );
  if (reply.status === "folded") {
    return foldedOpen ? (
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-amber-600">
          <span>已展开被折叠内容（仍在审核中）</span>
          <button type="button" onClick={() => setFoldedOpen(false)}>收起</button>
        </div>
        {body}
      </div>
    ) : (
      <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
        <p className="text-xs text-amber-700">该回复因多次举报已被折叠</p>
        <button type="button" onClick={() => setFoldedOpen(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">
          <Eye className="h-3.5 w-3.5" />展开查看
        </button>
      </div>
    );
  }
  return body;
}

export default function Question() {
  const { id } = useParams();
  const state = useDb();
  const navigate = useNavigate();
  const user = db.getCurrentUser(state);
  const question = db.getQuestion(state, id);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  if (!question) {
    return <div className="card p-10 text-center text-sm text-zinc-400">问题不存在</div>;
  }
  if (question.status === "hidden") {
    return <div className="card p-10 text-center text-sm text-zinc-400">该问题因违规已被隐藏</div>;
  }

  const authorSchools = JSON.parse(question.author?.verifiedSchools || "[]");

  function submitReply() {
    if (!content.trim()) return;
    try {
      act(db.createReply, id, content.trim());
      setContent("");
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />返回发现页
      </Link>

      {question.status === "folded" && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          该问题因多次举报已被折叠，正在人工审核中。
        </div>
      )}

      <section className="card p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-accent">
            {db.SCENARIO_LABEL[question.scenarioType] ?? question.scenarioType}
          </span>
          {question.tags.map((tag) => (
            <Link key={tag.id} to={`/search?q=${encodeURIComponent(tag.name)}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 hover:bg-blue-50 hover:text-accent">
              {tag.name}
            </Link>
          ))}
        </div>
        <h1 className="text-lg font-semibold leading-snug text-ink">{question.title}</h1>
        {question.description && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{question.description}</p>}
        <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
          <Link to={`/user/${question.author?.id}`} className="font-medium text-zinc-600 hover:text-accent">{question.author?.nickname}</Link>
          <VerifiedBadge schools={authorSchools} />
          <span>{db.formatRelative(question.createdAt)}</span>
          <span className="ml-auto">{question.replyCount} 条回复</span>
        </div>
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <LikeButton targetType="question" targetId={question.id} label="问题有帮助，点赞" />
            <FavoriteButton targetType="question" targetId={question.id} label="收藏这个问题" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">全部回复</h2>
        {question.replies.length === 0 ? (
          <p className="card p-6 text-center text-sm text-zinc-400">还没有回复，来当第一个分享的人</p>
        ) : (
          <div className="space-y-3">
            {question.replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} question={question} canAccept={user?.id === question.authorId} />
            ))}
          </div>
        )}
      </section>

      <div className="card p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 280))}
          placeholder={user ? "分享你的真实经验，最多 280 字" : "登录后可回复"}
          className="input min-h-[84px] resize-y"
          disabled={!user}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs ${content.length >= 270 ? "text-red-500" : "text-zinc-400"}`}>{content.length}/280</span>
          <button type="button" onClick={submitReply} disabled={!user || !content.trim()} className="btn-primary">
            发布回复
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
