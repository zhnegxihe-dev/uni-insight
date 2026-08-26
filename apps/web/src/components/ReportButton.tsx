"use client";

import { useState, useRef, useEffect } from "react";
import { Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/format";

const REASONS = [
  { key: "ad", label: "广告/中介" },
  { key: "abuse", label: "人身攻击" },
  { key: "irrelevant", label: "无关内容" },
  { key: "privacy", label: "隐私泄露" },
] as const;

interface ReportButtonProps {
  targetType: "question" | "reply" | "review" | "ai_post";
  targetId: string;
  compact?: boolean;
}

export function ReportButton({ targetType, targetId, compact }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function submit(reason: string) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessage({ type: "ok", text: data.message || "举报已提交" });
      setOpen(false);
    } else {
      setMessage({ type: "error", text: data.error || "举报失败" });
    }
    setBusy(false);
  }

  if (message?.type === "ok") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <Flag className="h-3.5 w-3.5" />
        已举报
      </span>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 transition hover:bg-red-50 hover:text-red-500",
          compact && "px-1.5"
        )}
        title="举报该内容"
        aria-label="举报"
      >
        <Flag className="h-3.5 w-3.5" />
        举报
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-line bg-white p-2 shadow-lg">
          <p className="px-1 pb-1.5 text-xs font-medium text-zinc-500">举报原因</p>
          {REASONS.map((reason) => (
            <button
              key={reason.key}
              type="button"
              disabled={busy}
              onClick={() => submit(reason.key)}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              {reason.label}
            </button>
          ))}
          {message && <p className="px-1 pt-1 text-xs text-red-500">{message.text}</p>}
        </div>
      )}
    </div>
  );
}
