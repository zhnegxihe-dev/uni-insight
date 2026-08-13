"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, email, password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error || "注册失败");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="reg-nickname">
          昵称
        </label>
        <input
          id="reg-nickname"
          className="input"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
          maxLength={40}
          placeholder="学长学姐怎么称呼你"
        />
      </div>
      <div>
        <label className="label" htmlFor="reg-email">
          邮箱
        </label>
        <input
          id="reg-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="label" htmlFor="reg-password">
          密码
        </label>
        <input
          id="reg-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="至少 8 位"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full transition-all duration-150 active:scale-[0.99]"
      >
        {busy ? "注册中…" : "注册并登录"}
      </button>
    </form>
  );
}
