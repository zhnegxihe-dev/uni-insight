"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/format";

interface AcceptButtonProps {
  replyId: string;
  accepted: boolean;
  canAccept: boolean;
}

export function AcceptButton({ replyId, accepted, canAccept }: AcceptButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    if (busy || !canAccept || accepted) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/replies/${replyId}/accept`, { method: "POST" });
    if (res.status === 401) {
      router.push("/login");
      setBusy(false);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "采纳失败");
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  if (!canAccept && !accepted) return null;

  return (
    <div className="flex items-center gap-1.5">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        type="button"
        onClick={accept}
        disabled={busy || accepted || !canAccept}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-150 active:scale-95",
          accepted
            ? "bg-emerald-50 text-emerald-600"
            : canAccept
              ? "border border-line text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
              : "cursor-not-allowed opacity-60"
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {accepted ? "已采纳" : busy ? "处理中…" : "采纳"}
      </button>
    </div>
  );
}
