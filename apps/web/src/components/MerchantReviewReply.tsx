"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MerchantReviewReply({ merchantId, reviewId }: { merchantId: string; reviewId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/merchants/${merchantId}/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: text }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setOpen(false);
      setText("");
      router.refresh();
    } else {
      setError(data.error || "回复失败");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs text-accent hover:underline">回复这条评价</button>
    );
  }
  return (
    <form onSubmit={submit} className="mt-2 space-y-2">
      <textarea className="input min-h-16" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="以商户身份回应（差评也建议回应）" required />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">取消</button>
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "提交中…" : "提交回复"}</button>
      </div>
    </form>
  );
}
