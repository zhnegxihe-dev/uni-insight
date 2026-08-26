import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDb, act } from "../store";
import * as db from "../db";

export default function Auth({ mode }) {
  const state = useDb();
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 内置演示账号（未注册 email 的 seed 用户），一键登录
  const demoUsers = state.users.filter((u) => !u.email);

  function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        const user = state.users.find((u) => u.email === email && u.password === password);
        if (!user) throw new Error("邮箱或密码不正确（可用下方演示账号一键登录）");
        act(db.loginAs, user.id);
      } else {
        act(db.registerUser, { nickname, email, password });
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-ink">{isLogin ? "登录" : "注册"}</h1>
        <p className="mt-1 text-sm text-zinc-500">静态演示版：账号保存在当前浏览器</p>
      </div>
      <form onSubmit={submit} className="card space-y-4 p-6">
        {!isLogin && (
          <div>
            <label className="label">昵称</label>
            <input className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} required maxLength={40} placeholder="学长学姐怎么称呼你" />
          </div>
        )}
        <div>
          <label className="label">邮箱</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">密码</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="至少 8 位" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {isLogin && (
          <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
            提示：内置演示账号请使用下方「一键登录」按钮，无需输入密码。
          </p>
        )}
        <button type="submit" className="btn-primary w-full">{isLogin ? "登录" : "注册并登录"}</button>
        <p className="text-center text-sm text-zinc-500">
          {isLogin ? "还没有账号？" : "已有账号？"}{" "}
          <Link to={isLogin ? "/register" : "/login"} className="font-medium text-accent hover:underline">
            {isLogin ? "去注册" : "去登录"}
          </Link>
        </p>
      </form>

      <div className="card p-6">
        <p className="mb-3 text-sm font-medium text-zinc-700">使用演示账号一键登录</p>
        <div className="flex flex-wrap gap-2">
          {demoUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                act(db.loginAs, u.id);
                navigate("/");
              }}
              className="rounded-full border border-line bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition hover:bg-blue-50 hover:text-accent"
            >
              {u.nickname}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
