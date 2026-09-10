"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LeadStatusActions({ merchantId, leadId, status }: { merchantId: string; leadId: string; status: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(next: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    const payload: Record<string, unknown> = { status: next };
    if (next === "deal") payload.dealAmount = Math.round((Number(amount) || 0) * 100);
    const res = await fetch(`/api/merchants/${merchantId}/leads/${leadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.refresh();
    } else {
      setError(data.error || "操作失败");
      setBusy(false);
    }
  }

  if (status === "deal") return <span className="text-xs text-emerald-600">已成交</span>;
  if (status === "cancelled") return <span className="text-xs text-zinc-400">已取消</span>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} onClick={() => update("contacted")} className="rounded-md border border-line px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">标记已联系</button>
      <input className="input h-8 w-20 py-0 text-xs" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金额(元)" />
      <button type="button" disabled={busy} onClick={() => update("deal")} className="rounded-md bg-accent px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50">成交并结算</button>
      <button type="button" disabled={busy} onClick={() => update("cancelled")} className="text-xs text-zinc-400 hover:text-zinc-600">取消</button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
