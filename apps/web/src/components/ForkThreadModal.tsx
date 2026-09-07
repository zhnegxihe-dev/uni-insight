"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/format";

export interface ForkItem {
  replyId: string;
  authorName: string;
  content: string;
}

interface ForkThreadModalProps {
  originQuestionId: string;
  originQuestionTitle: string;
  items: ForkItem[];
  label?: string;
  className?: string;
  align?: "right" | "left";
}

function firstSentence(content: string): string {
  const t = content.replace(/\s+/g, " ").trim();
  const head = t.split(/[。！？!?；;，,\n]/).find((p) => p.trim().length > 0)?.trim() || t;
  return head.length > 26 ? head.slice(0, 26) + "…" : head;
}

function suggestTitle(originTitle: string, items: ForkItem[]): string {
  const first = firstSentence(items[0]?.content || "");
  if (!first) return `关于《${originTitle}》的深入讨论`;
  return `关于《${originTitle}》中“${first}”的深入讨论`;
}

/** 转新帖：把单条回复或一段深聊引用为一条新问题（蓝图 v4.6 §8.16 / §8.14） */
export function ForkThreadModal({
  originQuestionId,
  originQuestionTitle,
  items,
  label = "转新帖",
  className,
  align = "left",
}: ForkThreadModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [titleIdx, setTitleIdx] = useState(0);
  const [titleTouched, setTitleTouched] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const candidates = (): string[] => {
    const base = suggestTitle(originQuestionTitle, items);
    return [base, `深入聊聊「${firstSentence(items[0]?.content || originQuestionTitle)}」`, `追问与讨论：${base.slice(0, 40)}`];
  };

  function openPanel() {
    const list = candidates();
    setTitle(list[0]);
    setTitleIdx(0);
    setTitleTouched(false);
    setNote("");
    setError("");
    setOpen(true);
  }

  function cycle() {
    const list = candidates();
    const next = (titleIdx + 1) % list.length;
    setTitleIdx(next);
    setTitle(list[next]);
    setTitleTouched(true);
  }

  async function submit() {
    if (busy) return;
    const t = title.trim();
    if (!t) {
      setError("请填写标题");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: t,
        description: note.trim() || null,
        originQuestionId,
        forkedFromReplyIds: items.map((i) => i.replyId),
      }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push(`/question/${data.id}`);
      router.refresh();
    } else {
      setError(data.error || "转帖失败，请稍后重试");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        title="把这段回复/讨论转为一条新问题，带上引用快照，可继续深入交流"
        className={cn("inline-flex items-center gap-1 text-[11px] text-zinc-400 transition hover:text-accent", align === "right" && "flex-row-reverse", className)}
      >
        <ArrowUpRight className="h-3 w-3" />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setOpen(false)}>
          <div className="card max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-ink">转为新帖</h3>
                <p className="mt-0.5 text-xs text-zinc-400">新帖会自动带上不可编辑的引用快照，并继承原问题的场景与标签</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="text-zinc-400 transition hover:text-ink" title="关闭">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-xs text-zinc-500">
              <div className="font-medium text-zinc-600">引用快照 · 转自《{originQuestionTitle}》</div>
              <div className="mt-1.5 space-y-1.5">
                {items.map((it) => (
                  <p key={it.replyId} className="whitespace-pre-wrap leading-relaxed">
                    <span className="font-medium text-zinc-600">@{it.authorName}：</span>
                    {it.content}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">新帖标题（≤150 字）</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }}
                  maxLength={150}
                />
                <button type="button" onClick={cycle} title="换一个标题建议" className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-3 text-xs text-zinc-500 transition hover:border-accent hover:text-accent">
                  <RefreshCw className="h-3.5 w-3.5" />
                  换标题
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">补充说明（可选，快照会由系统自动附在末尾）</label>
              <textarea className="input min-h-24" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="说明为什么想继续深入聊，或补充背景…" />
            </div>

            <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-400">转帖同样受广告词库与举报约束；被引用者会收到通知并可加入讨论。每人每天最多转 5 帖。</p>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded-lg border border-line px-4 py-2 text-sm text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-50">取消</button>
              <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                发布新帖
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
