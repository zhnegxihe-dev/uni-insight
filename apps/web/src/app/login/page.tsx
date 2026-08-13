import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "登录 - UniInsight" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-ink">登录</h1>
        <p className="mt-1 text-sm text-zinc-500">分享真实经验，帮助后来的求学者</p>
      </div>
      <div className="card p-6">
        <LoginForm />
        <p className="mt-4 text-center text-sm text-zinc-500">
          还没有账号？{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
