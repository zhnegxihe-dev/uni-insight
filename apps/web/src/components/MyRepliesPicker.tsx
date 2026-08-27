"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { cn, formatRelative, truncate } from "@/lib/format";

export interface PickerReply {
  id: string;
  content: string;
  questionId: string;
  questionTitle: string;
  scenarioLabel: string;
  starCount: number;
  createdAt: string;
}

export function MyRepliesPicker({ replies }: { replies: PickerReply[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("全部");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const labels = Array.from(new Set(replies.map((reply) => reply.scenarioLabel)));
  const visible = filter === "全部" ? replies : replies.filter((reply) => reply.scenarioLabel === filter);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setError("");
  }

  async function publish() {
    if (selected.length < 3 || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/ai-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replyIds: selected, title: title.trim() || undefined }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "需要 L2 等级才能发布");
      setBusy(false);
      return;
    }
    if (!res.ok) {
      setError("发布失败，请重试");
      setBusy(false);
      return;
    }
    const data = await res.json();
    router.push(`/post/${data.id}`);
  }

  if (replies.length === 0) {
    return <p className="text-sm text-zinc-400">还没有回复</p>;
  }

  return (
    <div>
      {labels.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {["全部", ...labels].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs transition-colors",
                filter === label ? "bg-ink text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {visible.length === 0 && <p className="text-sm text-zinc-400">该分类下暂无回复</p>}
        {visible.map((reply) => {
          const on = selected.includes(reply.id);
          return (
            <div
              key={reply.id}
              onClick={() => toggle(reply.id)}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors duration-150",
                on ? "border-accent bg-blue-50/60" : "border-line bg-white hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150",
                  on ? "border-accent bg-accent text-white" : "border-zinc-300 bg-white text-transparent"
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              <input type="checkbox" className="sr-only" checked={on} readOnly />
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">{reply.scenarioLabel}</span>
                  <span className="font-medium text-zinc-600">{reply.starCount} 点赞</span>
                  <span>{formatRelative(reply.createdAt)}</span>
                </span>
                <span className="block text-sm leading-relaxed text-ink">{reply.content}</span>
                <Link
                  href={`/question/${reply.questionId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1.5 inline-block text-xs text-accent hover:underline"
                >
                  来源：{truncate(reply.questionTitle, 40)}
                </Link>
              </span>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-3 z-10 mt-4 rounded-lg border border-line bg-white/95 p-3 shadow-sm backdrop-blur transition-shadow">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            placeholder="精选帖标题（可选，默认自动生成）"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={publish}
            disabled={selected.length < 3 || busy}
            className="btn-primary shrink-0 transition-all duration-150 active:scale-[0.98]"
          >
            <Sparkles className={cn("h-4 w-4", busy && "animate-pulse")} />
            {busy ? "生成中…" : `AI 总结并发布（${selected.length}）`}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <p className="mt-1.5 text-xs text-zinc-400">
          勾选至少 3 条回复，可跨问题把零散经验整合成一篇精选帖
        </p>
      </div>
    </div>
  );
}
