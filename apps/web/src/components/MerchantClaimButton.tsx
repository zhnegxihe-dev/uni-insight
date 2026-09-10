"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";

export function MerchantClaimButton({ merchantId }: { merchantId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function claim() {
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/merchants/${merchantId}/claim`, { method: "POST" });
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.refresh();
    } else {
      setError(data.error || "认领失败，请稍后重试");
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <button type="button" onClick={claim} disabled={busy} className="btn-ghost whitespace-nowrap disabled:opacity-50">
        <BadgeCheck className="h-4 w-4" />{busy ? "提交中…" : "我是店主 / 主理人，认领这家店"}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
