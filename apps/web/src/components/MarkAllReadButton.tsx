"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

export function MarkAllReadButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function markAll() {
    if (busy) return;
    setBusy(true);
    await fetch("/api/notifications/read", { method: "POST" });
    router.refresh();
    setBusy(false);
  }
  return (
    <button
      type="button"
      onClick={markAll}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
    >
      <CheckCheck className="h-3.5 w-3.5" />
      全部已读
    </button>
  );
}
