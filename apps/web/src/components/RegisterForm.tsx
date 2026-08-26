"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IDENTITY_ROLES } from "@/lib/core";

export function RegisterForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [targetSchool, setTargetSchool] = useState("");
  const [targetMajor, setTargetMajor] = useState("");
  const [region, setRegion] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        email,
        password,
        identity: { role, targetSchool, targetMajor, region },
      }),
    });
    if (res.ok) {
      router.push("/welcome");
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

      <div className="border-t border-line pt-3">
        <p className="mb-1.5 block text-sm font-medium text-zinc-700">你的身份（选填，用于个性化推荐）</p>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input"
          aria-label="身份"
        >
          <option value="">请选择…</option>
          {IDENTITY_ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-zinc-400">选填：目标学校 / 专业 / 地区，越具体推荐越准</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            className="input"
            value={targetSchool}
            onChange={(e) => setTargetSchool(e.target.value)}
            placeholder="目标学校，如：中山大学"
            maxLength={40}
          />
          <input
            className="input"
            value={targetMajor}
            onChange={(e) => setTargetMajor(e.target.value)}
            placeholder="目标专业，如：经济学"
            maxLength={40}
          />
          <input
            className="input"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="地区，如：广东"
            maxLength={20}
          />
        </div>
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
