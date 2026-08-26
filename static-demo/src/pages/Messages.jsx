import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { useDb, act } from "../store";
import * as db from "../db";
import { VerifiedBadge } from "../components";

export default function Messages() {
  const state = useDb();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = db.getCurrentUser(state);
  const to = params.get("to");

  const items = db.getConversations(state);
  const totalUnread = items.reduce((sum, i) => sum + i.unread, 0);

  useEffect(() => {
    if (to && user) {
      const conv = act(db.getOrCreateConversation, user.id, to);
      navigate(`/messages/${conv.id}`, { replace: true });
    }
  }, [to, user?.id]);

  if (!user) return <div className="card p-10 text-center text-sm text-zinc-400">请先登录查看消息</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />返回发现页
      </Link>
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-accent" />
        <h1 className="text-lg font-semibold text-ink">消息</h1>
        {totalUnread > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">{totalUnread} 未读</span>}
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-400">还没有会话。去用户主页给对方发消息，互相关注后即可畅聊</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const schools = JSON.parse(item.other?.verifiedSchools || "[]");
            return (
              <Link key={item.id} to={`/messages/${item.id}`} className="card block px-4 py-3 transition hover:border-zinc-300">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
                    {item.other?.nickname?.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{item.other?.nickname}</span>
                      <VerifiedBadge schools={schools} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-zinc-500">
                      {item.lastMessage ? `${item.lastMessage.senderId === user.id ? "我：" : ""}${item.lastMessage.content}` : "开始聊天"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.lastMessage && <p className="text-xs text-zinc-400">{db.formatRelative(item.lastMessage.createdAt)}</p>}
                    {item.unread > 0 && (
                      <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-medium text-white">{item.unread}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
