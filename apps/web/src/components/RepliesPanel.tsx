"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquare, Send } from "lucide-react";
import { cn, formatRelative, safeParse } from "@/lib/format";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { LikeButton } from "@/components/LikeButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReportButton } from "@/components/ReportButton";
import { AcceptButton } from "@/components/AcceptButton";
import { FoldedContent } from "@/components/FoldedContent";
import { UpgradeReplyButton } from "@/components/UpgradeReplyButton";
import { QuoteReplyButton } from "@/components/QuoteReplyButton";
import { ForkThreadModal, type ForkItem } from "@/components/ForkThreadModal";

export interface ReplyAuthorData {
  id: string;
  nickname: string;
  level: number;
  verifiedSchools: string;
}

export interface ReplyData {
  id: string;
  content: string;
  parentReplyId: string | null;
  status: string;
  isAccepted: boolean;
  starCount: number;
  favoriteCount: number;
  createdAt: string;
  author: ReplyAuthorData;
}

interface RepliesPanelProps {
  questionId: string;
  questionTitle: string;
  questionOwnerId: string;
  currentUserId: string | null;
  scenarioType: string;
  replies: ReplyData[];
  starredReplyIds: string[];
  favoritedReplyIds: string[];
}

function InlineComposer({
  placeholder,
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  onSubmit: (text: string) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setError("");
    const err = await onSubmit(t);
    if (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
      <textarea
        autoFocus
        className="input min-h-[64px]"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 280))}
        placeholder={placeholder}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{text.length}/280</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-lg border border-line px-3 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-50">
            取消
          </button>
          <button type="button" onClick={go} disabled={busy || !text.trim()} className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            发布追问
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function maxAlternatingRun(ids: string[]): { len: number; start: number } {
  const n = ids.length;
  let best = { len: 0, start: 0 };
  for (let i = 0; i < n; i++) {
    if (i + 1 >= n) {
      if (1 > best.len) best = { len: 1, start: i };
      break;
    }
    const a = ids[i];
    const b = ids[i + 1];
    if (a === b) continue;
    let len = 2;
    for (let k = i + 2; k < n; k++) {
      const expect = ids[k - 1] === a ? b : a;
      if (ids[k] !== expect) break;
      len++;
    }
    if (len > best.len) best = { len, start: i };
  }
  return best;
}

/** 问题下的全部回复：一级追问 + 升级/引用发帖 + 转新帖 + 深聊气泡（蓝图 v4.6 §8.16/§8.14） */
export function RepliesPanel({
  questionId,
  questionTitle,
  questionOwnerId,
  currentUserId,
  scenarioType,
  replies,
  starredReplyIds,
  favoritedReplyIds,
}: RepliesPanelProps) {
  const router = useRouter();
  const starred = new Set(starredReplyIds);
  const favorited = new Set(favoritedReplyIds);
  const [composingRootId, setComposingRootId] = useState<string | null>(null);
  const [ignoredForks, setIgnoredForks] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("ui:fork-ignored");
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const replyById = new Map(replies.map((r) => [r.id, r]));
  const visible = replies.filter((r) => r.status !== "hidden");
  const roots = visible
    .filter((r) => !r.parentReplyId || !replyById.has(r.parentReplyId))
    .sort((a, b) => b.starCount - a.starCount || a.createdAt.localeCompare(b.createdAt));
  const childrenOf = (rootId: string) =>
    visible.filter((r) => r.parentReplyId === rootId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function ignoreFork(rootId: string) {
    const next = new Set(ignoredForks);
    next.add(rootId);
    setIgnoredForks(next);
    try {
      localStorage.setItem("ui:fork-ignored", JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
  }

  async function postChild(rootId: string, text: string): Promise<string | null> {
    const res = await fetch(`/api/questions/${questionId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, parentReplyId: rootId }),
    });
    if (res.status === 401) {
      router.push("/login");
      return null;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return String(data.error || "发布失败");
    setComposingRootId(null);
    router.refresh();
    return null;
  }

  function renderReplyActions(reply: ReplyData, isRoot: boolean) {
    const isOwn = currentUserId === reply.author.id;
    const canAccept = currentUserId === questionOwnerId && !reply.isAccepted;
    const forkItems: ForkItem[] = [
      { replyId: reply.id, authorName: reply.author.nickname, content: reply.content },
    ];
    return (
      <div className="mt-3 space-y-2 border-t border-line pt-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {isRoot && canAccept && <AcceptButton replyId={reply.id} accepted={reply.isAccepted} canAccept />}
          <LikeButton endpoint={`/api/replies/${reply.id}/star`} count={reply.starCount} active={starred.has(reply.id)} label="这条回复有帮助" />
          <FavoriteButton endpoint={`/api/replies/${reply.id}/favorite`} count={reply.favoriteCount} active={favorited.has(reply.id)} label="收藏这条回复" />
          <div className="ml-auto">
            <ReportButton targetType="reply" targetId={reply.id} compact />
          </div>
        </div>
        {currentUserId && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
            {isRoot && (
              <button
                type="button"
                onClick={() => setComposingRootId(composingRootId === reply.id ? null : reply.id)}
                className={cn("inline-flex items-center gap-1 transition", composingRootId === reply.id ? "text-accent" : "text-zinc-400 hover:text-accent")}
              >
                <MessageSquare className="h-3 w-3" />
                {composingRootId === reply.id ? "收起追问" : "追问"}
              </button>
            )}
            {isOwn && reply.status === "visible" && (
              <UpgradeReplyButton replyId={reply.id} questionId={questionId} replyContent={reply.content} questionTitle={questionTitle} scenarioType={scenarioType} />
            )}
            {!isOwn && reply.status === "visible" && (
              <QuoteReplyButton replyId={reply.id} questionId={questionId} replyContent={reply.content} replyAuthorName={reply.author.nickname} questionTitle={questionTitle} scenarioType={scenarioType} />
            )}
            {reply.status === "visible" && (
              <ForkThreadModal originQuestionId={questionId} originQuestionTitle={questionTitle} items={forkItems} label="转新帖" />
            )}
          </div>
        )}
      </div>
    );
  }

  function renderReplyBody(reply: ReplyData, isRoot: boolean) {
    const schools = safeParse<string[]>(reply.author.verifiedSchools, []);
    const inner = (
      <div className="card p-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-600">{reply.author.nickname}</span>
          <VerifiedBadge schools={schools} />
          <span>L{reply.author.level}</span>
          {!isRoot && (
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">追问</span>
          )}
          {reply.isAccepted && (
            <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              最有用
            </span>
          )}
          <span className="ml-auto">{formatRelative(reply.createdAt)}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink">{reply.content}</p>
        {renderReplyActions(reply, isRoot)}
      </div>
    );
    return reply.status === "folded" ? <FoldedContent>{inner}</FoldedContent> : inner;
  }

  function renderThread(root: ReplyData) {
    const children = childrenOf(root.id);
    const seq = [root, ...children].map((r) => r.author.id);
    const run = maxAlternatingRun(seq);
    const runIds = seq.slice(run.start, run.start + run.len);
    const runSet = new Set(runIds);
    const runAuthors = [...new Set(runIds)];
    const lastByAuthor = new Map<string, number>();
    for (const r of [root, ...children]) {
      lastByAuthor.set(r.author.id, new Date(r.createdAt).getTime());
    }
    const active24h =
      runAuthors.length >= 2 &&
      runAuthors.every((aid) => Date.now() - (lastByAuthor.get(aid) ?? 0) < 24 * 3600 * 1000);
    const showBubble =
      run.len >= 3 &&
      active24h &&
      [root, ...children].every((r) => r.status === "visible") &&
      !ignoredForks.has(root.id);
    const bubbleItems: ForkItem[] = (showBubble ? [root, ...children] : [])
      .filter((r) => runSet.has(r.author.id))
      .slice(-3)
      .map((r) => ({ replyId: r.id, authorName: r.author.nickname, content: r.content }));

    return (
      <div key={root.id} className={cn(children.length > 0 && "space-y-3")}>
        {renderReplyBody(root, true)}
        {composingRootId === root.id && (
          <div className="pl-3">
            <InlineComposer
              placeholder={`追问 @${root.author.nickname}（最多 280 字）`}
              onSubmit={(text) => postChild(root.id, text)}
              onCancel={() => setComposingRootId(null)}
            />
          </div>
        )}
        {children.length > 0 && (
          <div className="space-y-3 border-l-2 border-zinc-100 pl-3">
            {children.map((child) => renderReplyBody(child, false))}
            {showBubble && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-500">
                <span>你们围绕这条回复来回聊了 {run.len} 轮，要不要开个新帖继续深入？</span>
                <div className="flex items-center gap-1">
                  <ForkThreadModal originQuestionId={questionId} originQuestionTitle={questionTitle} items={bubbleItems} label="一键转帖" />
                  <button type="button" onClick={() => ignoreFork(root.id)} className="text-zinc-400 transition hover:text-ink">
                    忽略
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (roots.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">全部回复</h2>
        <p className="card p-6 text-center text-sm text-zinc-400">还没有回复，来当第一个分享的人</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-ink">全部回复</h2>
      <div className="space-y-3">
        {roots.map((root) => renderThread(root))}
      </div>
    </section>
  );
}
