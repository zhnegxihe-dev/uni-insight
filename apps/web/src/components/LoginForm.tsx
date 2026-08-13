"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { label: "提问账号", email: "seeker@demo.uni", password: "Test1234!", note: "高三考生视角" },
  { label: "回答账号", email: "alumni@demo.uni", password: "Test1234!", note: "中大经济学长 L2" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error || "登录失败");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="login-email">
          邮箱
        </label>
        <input
          id="login-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="label" htmlFor="login-password">
          密码
        </label>
        <input
          id="login-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full transition-all duration-150 active:scale-[0.99]"
      >
        {busy ? "登录中…" : "登录"}
      </button>

      <div className="rounded-lg border border-line p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <KeyRound className="h-3.5 w-3.5" />
          测试账号（点击自动填入）
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="rounded-md border border-line px-3 py-2 text-left text-xs hover:bg-zinc-50"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
              }}
            >
              <span className="block font-medium text-ink">{account.label}</span>
              <span className="block text-zinc-500">{account.email}</span>
              <span className="block text-zinc-400">{account.note}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
