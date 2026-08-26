"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles } from "lucide-react";

const HOT_QUERIES = ["中山大学 经济学", "转专业值得吗", "考研保研 目标院校", "申研留学 英国", "选导师 怎么选", "经济学 就业前景"];

export default function WelcomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(q?: string) {
    const value = (q ?? query).trim();
    if (!value || busy) return;
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/recommendations/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: value }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessage(data.message || "推荐已生成");
      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 900);
    } else {
      setMessage(data.error || "操作失败，请重试");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
          <Sparkles className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold text-ink">告诉我们你最关心什么</h1>
        <p className="mt-2 text-sm text-zinc-500">
          输入你正在纠结的升学问题，我们会据此为你推荐最相关的内容。之后你的浏览和搜索也会让推荐越来越准。
        </p>
      </div>

      <div className="card p-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="如：中山大学经济学怎么样"
              className="input pl-9"
              maxLength={100}
            />
          </div>
          <button type="button" onClick={() => submit()} disabled={busy} className="btn-primary shrink-0">
            {busy ? "生成中…" : "开始推荐"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {message && <p className="mt-2 text-sm font-medium text-emerald-600">{message}</p>}

        <div className="mt-4">
          <p className="mb-2 text-xs text-zinc-400">或直接点一个热门词：</p>
          <div className="flex flex-wrap gap-2">
            {HOT_QUERIES.map((item) => (
              <button
                key={item}
                type="button"
                disabled={busy}
                onClick={() => {
                  setQuery(item);
                  submit(item);
                }}
                className="rounded-full border border-line bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600 transition hover:border-accent hover:bg-blue-50 hover:text-accent disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          router.push("/");
          router.refresh();
        }}
        className="mx-auto block text-sm text-zinc-400 hover:text-ink"
      >
        先逛逛，跳过
      </button>
    </div>
  );
}
