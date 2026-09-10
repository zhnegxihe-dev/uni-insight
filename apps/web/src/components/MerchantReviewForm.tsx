"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/lib/format";

interface Dim { key: string; label: string }

export function MerchantReviewForm({ merchantId, dims }: { merchantId: string; dims: Dim[] }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [dimValues, setDimValues] = useState<Record<string, number>>({});
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/merchants/${merchantId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, dims: dimValues, content, isAnonymous }),
    });
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.refresh();
    } else {
      setError(data.error || "评价提交失败，请稍后重试");
      setBusy(false);
    }
  }

  const stars = (value: number, onPick: (v: number) => void, size = "h-5 w-5") => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((v) => (
        <button key={v} type="button" onClick={() => onPick(v)} className="transition" title={`${v} 星`}>
          <Star className={cn(size, v <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300")} />
        </button>
      ))}
    </div>
  );

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="text-sm font-semibold text-ink">写评价（真实消费 / 使用后分享）</h3>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-zinc-500">总评</span>
        {stars(rating, setRating)}
      </div>
      {dims.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {dims.map((d) => (
            <div key={d.key} className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-500">{d.label}</span>
              {stars(dimValues[d.key] ?? 0, (v) => setDimValues((prev) => ({ ...prev, [d.key]: v })), "h-4 w-4")}
            </div>
          ))}
        </div>
      )}
      <textarea
        className="input min-h-24"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={2000}
        placeholder="说说你的真实体验：好在哪、坑在哪、适合什么场景……"
        required
      />
      <label className="flex items-center gap-2 text-xs text-zinc-500">
        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
        匿名展示（昵称与认证信息对其他人隐藏，保护差评）
      </label>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "提交中…" : "发布评价"}</button>
      </div>
    </form>
  );
}
