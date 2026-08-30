import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { Bell, GraduationCap, MessageSquare, Plus, Search, Settings, LogOut } from "lucide-react";
import { useDb, act } from "./store";
import * as db from "./db";

import Home from "./pages/Home";
import Ask from "./pages/Ask";
import Question from "./pages/Question";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import User from "./pages/User";
import School from "./pages/School";
import Major from "./pages/Major";
import Course from "./pages/Course";
import Teacher from "./pages/Teacher";
import SearchPage from "./pages/Search";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import Notifications from "./pages/Notifications";
import Levels from "./pages/Levels";
import Posts from "./pages/Posts";
import PostNew from "./pages/PostNew";
import PostDetail from "./pages/PostDetail";
import Schools from "./pages/Schools";
import Promo from "./pages/Promo";

function Header() {
  const state = useDb();
  const user = db.getCurrentUser(state);
  const unread = db.unreadCounts(state);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 lg:gap-5">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold text-ink">UniInsight</span>
            <span className="block text-xs text-zinc-400">升学问问 · 演示</span>
          </span>
        </Link>

        <nav className="hidden shrink-0 items-center gap-0.5 text-sm text-zinc-600 lg:flex">
          <Link to="/" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-50">发现</Link>
          <Link to="/posts" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-50">经验帖</Link>
          <Link to="/schools" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-50">院校</Link>
          <Link to="/levels" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-50">积分等级</Link>
          <Link to="/compare" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-50">学校对比</Link>
        </nav>

        <form
          className="ml-auto hidden w-64 shrink-0 items-center xl:flex"
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget).get("q");
            navigate(`/search?q=${encodeURIComponent(v || "")}`);
          }}
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input name="q" placeholder="搜索学校、专业、问题" className="input pl-9" />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
          <Link to="/ask" className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" />
            提问
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="flex shrink-0 items-center gap-2 rounded-md border border-line px-2.5 py-2 text-sm text-zinc-700 hover:bg-zinc-50 lg:px-3">
                <span className="max-w-[72px] truncate md:max-w-[96px]">{user.nickname}</span>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">L{user.level}</span>
              </Link>
              <Link to="/notifications" className="relative shrink-0 rounded-md border border-line p-2 text-zinc-600 transition hover:bg-zinc-50" title="通知">
                <Bell className="h-4 w-4" />
                {unread.notifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                    {unread.notifications > 99 ? "99+" : unread.notifications}
                  </span>
                )}
              </Link>
              <Link to="/messages" className="relative shrink-0 rounded-md border border-line p-2 text-zinc-600 transition hover:bg-zinc-50" title="消息">
                <MessageSquare className="h-4 w-4" />
                {unread.messages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                    {unread.messages > 99 ? "99+" : unread.messages}
                  </span>
                )}
              </Link>
              <Link to="/settings" className="hidden shrink-0 items-center rounded-md border border-line p-2 text-zinc-600 transition hover:bg-zinc-50 md:inline-flex" title="设置与认证">
                <Settings className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  act(db.logout);
                  navigate("/");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-zinc-500 hover:bg-zinc-50 hover:text-ink"
                title="退出"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden whitespace-nowrap px-2 text-sm text-zinc-600 hover:text-ink sm:block">登录</Link>
              <Link to="/register" className="btn-ghost whitespace-nowrap">注册</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function DemoBanner() {
  return (
    <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs text-amber-700">
      <span className="rounded bg-amber-50 px-2 py-0.5">静态演示版：数据保存在当前浏览器，刷新不丢失，清缓存后重置</span>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <DemoBanner />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/question/:id" element={<Question />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:id" element={<User />} />
          <Route path="/school/:slug" element={<School />} />
          <Route path="/major/:slug" element={<Major />} />
          <Route path="/course/:id" element={<Course />} />
          <Route path="/teacher/:id" element={<Teacher />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/levels" element={<Levels />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/promo" element={<Promo />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/posts/new" element={<PostNew />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-zinc-400">
        UniInsight 升学问问 · 静态演示版 · 数据仅存于浏览器
      </footer>
    </div>
  );
}
