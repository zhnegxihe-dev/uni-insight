import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata = { title: "注册 - UniInsight" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-ink">注册</h1>
        <p className="mt-1 text-sm text-zinc-500">学校邮箱认证后可点亮认证标识</p>
      </div>
      <div className="card p-6">
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-zinc-500">
          已有账号？{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
