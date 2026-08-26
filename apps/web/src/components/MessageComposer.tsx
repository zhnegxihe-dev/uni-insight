"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

interface MessageComposerProps {
  toUserId: string;
  toNickname: string;
  mutual: boolean;
}

export function MessageComposer({ toUserId, toNickname, mutual }: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error" | "info"; text: string } | null>(null);
  const router = useRouter();

  async function submit() {
    const text = content.trim();
    if (!text || busy) return;
    setBusy(true);
    setFeedback(null);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId, content: text }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setContent("");
      setFeedback({ type: "ok", text: "已发送" });
      router.refresh();
    } else {
      setFeedback({ type: "error", text: data.error || "发送失败" });
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-line bg-white p-3">
      {!mutual && (
        <p className="mb-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
          你们还未互相关注，每人只能发送一条打招呼消息。关注对方并与对方互相关注后即可畅聊。
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 500))}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
          placeholder={`给 ${toNickname} 发消息…`}
          className="input flex-1"
        />
        <button type="button" onClick={submit} disabled={busy || !content.trim()} className="btn-primary shrink-0">
          <Send className="h-4 w-4" />
          发送
        </button>
      </div>
      {feedback && (
        <p className={feedback.type === "ok" ? "mt-1.5 text-xs font-medium text-emerald-600" : feedback.type === "info" ? "mt-1.5 text-xs text-zinc-500" : "mt-1.5 text-xs text-red-500"}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
