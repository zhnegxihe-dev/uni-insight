"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, truncate } from "@/lib/format";

interface AiPostCreatorProps {
  questionId: string;
  replies: { id: string; author: string; content: string }[];
}

export function AiPostCreator({ questionId, replies }: AiPostCreatorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function publish() {
    if (selected.length < 3 || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/ai-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, replyIds: selected }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "发布失败");
      setBusy(false);
      return;
    }
    const data = await res.json();
    router.push(`/post/${data.id}`);
    router.refresh();
  }

  return (
    <div className="card p-4 transition-shadow hover:shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-ink">AI 精选帖</h2>
        <span className="text-xs text-zinc-400">勾选至少 3 条相似回复，AI 总结后发布</span>
      </div>
      <div className="max-h-64 space-y-1.5 overflow-auto pr-1">
        {replies.map((reply) => {
          const on = selected.includes(reply.id);
          return (
            <label
              key={reply.id}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 text-sm transition-colors duration-150",
                on ? "border-accent bg-blue-50/60" : "border-line hover:bg-zinc-50"
              )}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(reply.id)}
                className="mt-0.5 h-4 w-4 accent-blue-600"
              />
              <span className="min-w-0">
                <span className="mb-0.5 block text-xs font-medium text-zinc-500">{reply.author}</span>
                <span className="block text-ink">{truncate(reply.content, 80)}</span>
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-zinc-400">已选 {selected.length} 条</span>
        <button
          type="button"
          onClick={publish}
          disabled={selected.length < 3 || busy}
          className="btn-primary transition-all duration-150 active:scale-[0.98]"
        >
          <Sparkles className={cn("h-4 w-4", busy && "animate-pulse")} />
          {busy ? "生成中…" : "AI 总结并发布"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
