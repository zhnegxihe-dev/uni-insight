import Link from "next/link";
import { GraduationCap, LogOut, Plus, Search } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold text-ink">UniInsight</span>
            <span className="block text-xs text-zinc-400">升学问问</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-zinc-600 md:flex">
          <Link href="/" className="rounded-md px-3 py-1.5 hover:bg-zinc-50">
            发现
          </Link>
          <Link href="/levels" className="rounded-md px-3 py-1.5 hover:bg-zinc-50">
            Star 等级
          </Link>
        </nav>

        <form action="/search" className="ml-auto hidden w-72 items-center sm:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              name="q"
              placeholder="搜索学校、专业、问题"
              className="input pl-9"
              defaultValue=""
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <Link href="/ask" className="btn-primary">
            <Plus className="h-4 w-4" />
            提问
          </Link>
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <span className="max-w-[120px] truncate">{user.nickname}</span>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
                  L{user.level}
                </span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden px-2 text-sm text-zinc-600 hover:text-ink sm:block">
                登录
              </Link>
              <Link href="/register" className="btn-ghost">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
