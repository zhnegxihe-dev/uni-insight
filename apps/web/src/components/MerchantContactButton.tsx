"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

export function MerchantContactButton({ merchantId, postId }: { merchantId: string; postId?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/merchants/${merchantId}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, contact, sourcePostId: postId ?? null }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDone("已提交，商家会尽快联系你（平台担保成交，佣金仅在实际成交后结算）");
      setOpen(false);
      setMessage("");
      setContact("");
    } else {
      setError(data.error || "提交失败，请稍后重试");
    }
    setBusy(false);
  }

  if (done) return <p className="text-xs text-emerald-600">{done}</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary whitespace-nowrap">
        <MessageSquare className="h-4 w-4" />咨询 / 报名
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="card w-full space-y-2 p-4">
      <p className="text-sm font-medium text-ink">向商家咨询 / 报名</p>
      <textarea className="input min-h-20" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="想了解什么？例如：周末营业时间、考研班型与价格、预约方式…" />
      <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={100} placeholder="联系方式（微信/手机号，仅商家可见）" />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">取消</button>
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "提交中…" : "提交咨询"}</button>
      </div>
    </form>
  );
}
