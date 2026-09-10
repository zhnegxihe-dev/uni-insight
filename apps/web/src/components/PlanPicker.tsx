"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { MERCHANT_PLANS } from "@/lib/core";
import { cn } from "@/lib/format";

export function PlanPicker({ merchantId, currentPlan }: { merchantId: string; currentPlan: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function choose(plan: string) {
    if (busy) return;
    setBusy(plan);
    setError("");
    const res = await fetch(`/api/merchants/${merchantId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.refresh();
    } else {
      setError(data.error || "操作失败");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {MERCHANT_PLANS.map((p) => (
          <div key={p.key} className={cn("card flex flex-col p-5", currentPlan === p.key && "border-accent ring-1 ring-accent")}>
            <p className="text-sm font-semibold text-ink">{p.label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {p.price === 0 ? "免费" : `¥${(p.price / 100).toFixed(0)}`}
              {p.period && <span className="text-xs font-normal text-zinc-400"> / {p.period}</span>}
            </p>
            <ul className="mt-3 flex-1 space-y-1.5 text-xs text-zinc-600">
              {p.perks.map((x) => (
                <li key={x} className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{x}</li>
              ))}
            </ul>
            <button type="button" disabled={busy !== null || currentPlan === p.key} onClick={() => choose(p.key)} className={cn("mt-4 rounded-md px-3 py-2 text-sm disabled:opacity-50", currentPlan === p.key ? "bg-zinc-100 text-zinc-500" : "btn-primary")}>
              {currentPlan === p.key ? "当前套餐" : busy === p.key ? "处理中…" : p.price === 0 ? "切换到免费版" : "选择该套餐"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-400">演示环境未接入支付：选择套餐后直接开通 365 天；生产环境需在支付回调确认后生效。</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
