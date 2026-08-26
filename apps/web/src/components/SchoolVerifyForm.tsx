"use client";

import { useState } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface SchoolVerifyFormProps {
  verifiedSchools: string[];
}

/** 学校邮箱认证（演示模式）：输入学校邮箱，域名匹配即认证。 */
export function SchoolVerifyForm({ verifiedSchools }: SchoolVerifyFormProps) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function submit() {
    if (busy || !email.trim()) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessage({ type: "ok", text: data.message || "认证成功" });
      setEmail("");
      router.refresh();
    } else {
      setMessage({ type: "error", text: data.error || "认证失败" });
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <h2 className="text-base font-semibold text-ink">学校邮箱认证</h2>
      </div>
      <p className="mb-3 text-sm text-zinc-500">
        使用学校官方邮箱（如 <span className="font-medium text-zinc-700">xxx@sysu.edu.cn</span>）认证，
        即可获得「认证校友」标识并解锁结构化评价。演示模式：域名匹配即认证，不发送真实邮件。
      </p>
      <div className="flex max-w-md gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@school.edu.cn"
          className="input"
        />
        <button type="button" onClick={submit} disabled={busy || !email.trim()} className="btn-primary shrink-0">
          <BadgeCheck className="h-4 w-4" />
          {busy ? "认证中" : "认证"}
        </button>
      </div>
      {message && (
        <p className={message.type === "ok" ? "mt-2 text-sm font-medium text-emerald-600" : "mt-2 text-sm text-red-500"}>
          {message.text}
        </p>
      )}
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium text-zinc-500">当前已认证学校</p>
        {verifiedSchools.length === 0 ? (
          <p className="text-sm text-zinc-400">尚未认证任何学校</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {verifiedSchools.map((school) => (
              <span
                key={school}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                {school}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
