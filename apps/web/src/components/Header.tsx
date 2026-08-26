import Link from "next/link";
import { Bell, GraduationCap, LogOut, MessageSquare, Plus, Search, Settings, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getUnreadCounts } from "@/lib/social";
import { LogoutButton } from "@/components/LogoutButton";

export async function Header() {
  const user = await getSessionUser();
  const unread = user ? await getUnreadCounts(user.id) : { notifications: 0, messages: 0 };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 lg:gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold text-ink">UniInsight</span>
            <span className="block text-xs text-zinc-400">升学问问</span>
          </span>
        </Link>

        <nav className="hidden shrink-0 items-center gap-0.5 text-sm text-zinc-600 lg:flex">
          <Link href="/" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-50">
            发现
          </Link>
          <Link href="/following" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-50">
            关注
          </Link>
          <Link href="/levels" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-50">
            Star 等级
          </Link>
          <Link href="/compare" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-50">
            学校对比
          </Link>
        </nav>

        <form action="/search" className="ml-auto hidden w-64 shrink-0 items-center xl:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input name="q" placeholder="搜索学校、专业、问题" className="input pl-9" defaultValue="" />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
          <Link href="/ask" className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" />
            提问
          </Link>
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex shrink-0 items-center gap-2 rounded-md border border-line px-2.5 py-2 text-sm text-zinc-700 hover:bg-zinc-50 lg:px-3"
              >
                <span className="max-w-[72px] truncate md:max-w-[96px] xl:max-w-[120px]">{user.nickname}</span>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
                  L{user.level}
                </span>
              </Link>
              <Link
                href="/notifications"
                className="relative shrink-0 rounded-md border border-line p-2 text-zinc-600 transition hover:bg-zinc-50"
                title="通知"
              >
                <Bell className="h-4 w-4" />
                {unread.notifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                    {unread.notifications > 99 ? "99+" : unread.notifications}
                  </span>
                )}
              </Link>
              <Link
                href="/messages"
                className="relative shrink-0 rounded-md border border-line p-2 text-zinc-600 transition hover:bg-zinc-50"
                title="消息"
              >
                <MessageSquare className="h-4 w-4" />
                {unread.messages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                    {unread.messages > 99 ? "99+" : unread.messages}
                  </span>
                )}
              </Link>
              <Link
                href="/settings"
                className="hidden shrink-0 items-center gap-1 rounded-md border border-line px-2.5 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 md:inline-flex"
                title="设置与认证"
              >
                <Settings className="h-4 w-4" />
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-ink px-2.5 py-2 text-sm text-white transition hover:bg-zinc-800"
                  title="管理后台"
                >
                  <ShieldCheck className="h-4 w-4" />
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden whitespace-nowrap px-2 text-sm text-zinc-600 hover:text-ink sm:block">
                登录
              </Link>
              <Link href="/register" className="btn-ghost whitespace-nowrap">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
