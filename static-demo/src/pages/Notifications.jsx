import { Link } from "react-router-dom";
import { Bell, CheckCircle2, MessageSquare, Star, UserPlus, XCircle } from "lucide-react";
import { useDb, act } from "../store";
import * as db from "../db";

export default function Notifications() {
  const state = useDb();
  const user = db.getCurrentUser(state);
  if (!user) return <div className="card p-10 text-center text-sm text-zinc-400">请先登录查看通知</div>;

  const items = db.getNotifications(state);
  const unread = items.filter((n) => !n.readAt).length;

  function renderRow(n) {
    const payload = n.payload;
    let icon = <Bell className="h-4 w-4 text-zinc-400" />;
    let text = "";
    const actorName = payload.actorName || "有人";
    switch (n.type) {
      case "reply":
        icon = <MessageSquare className="h-4 w-4 text-accent" />;
        text = `${actorName} 回复了你的问题「${payload.questionTitle ?? ""}」`;
        break;
      case "accept":
        icon = <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        text = `${actorName} 采纳了你的回复`;
        break;
      case "star":
        icon = <Star className="h-4 w-4 text-amber-500" />;
        text = `${actorName} 点亮了你的内容`;
        break;
      case "follow":
        icon = <UserPlus className="h-4 w-4 text-accent" />;
        text = `${actorName} 关注了你`;
        break;
      case "message":
        icon = <MessageSquare className="h-4 w-4 text-accent" />;
        text = `${actorName} 给你发了一条消息：${payload.content ?? ""}`;
        break;
      default:
        text = "你有新的系统通知";
    }
    const href = payload.questionId ? `/question/${payload.questionId}` : payload.conversationId ? `/messages/${payload.conversationId}` : null;
    const body = (
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-ink">{text}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{db.formatRelative(n.createdAt)}</p>
        </div>
        {!n.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
      </div>
    );
    return href ? (
      <Link key={n.id} to={href} className="card block p-4 transition hover:border-zinc-300">{body}</Link>
    ) : (
      <div key={n.id} className="card p-4">{body}</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-semibold text-ink">通知</h1>
          {unread > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">{unread} 未读</span>}
        </div>
        <button type="button" onClick={() => act(db.markAllNotificationsRead)} className="rounded-md border border-line px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50">
          全部已读
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-400">还没有通知。有人回复、采纳、点亮或关注你时会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-2">{items.map(renderRow)}</div>
      )}
    </div>
  );
}
