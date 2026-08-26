"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminReportActionsProps {
  reportId: string;
}

/** 管理后台：确认违规 / 驳回举报。 */
export function AdminReportActions({ reportId }: AdminReportActionsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function act(action: "resolve" | "dismiss") {
    if (busy) return;
    setBusy(action);
    setMessage(null);
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessage({ type: "ok", text: data.message || "处理成功" });
      router.refresh();
    } else {
      setMessage({ type: "error", text: data.error || "操作失败" });
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => act("resolve")}
          className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          确认违规
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => act("dismiss")}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          驳回举报
        </button>
      </div>
      {message && <p className={message.type === "ok" ? "text-xs text-emerald-600" : "text-xs text-red-500"}>{message.text}</p>}
    </div>
  );
}
