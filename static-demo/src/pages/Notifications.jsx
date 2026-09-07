import { Link } from "react-router-dom";
import { ArrowUpRight, Bell, Bookmark, CheckCircle2, Heart, MessageSquare, UserPlus, XCircle } from "lucide-react";
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
    const actor = payload.actorName || (payload.actorId ? (state.users.find((u) => u.id === payload.actorId)?.nickname || "有人") : "有人");
    let icon = <Bell className="h-4 w-4 text-zinc-400" />;
    let text = "";
    switch (payload.type || n.type) {
      case "reply":
        icon = <MessageSquare className="h-4 w-4 text-accent" />;
        text = payload.parentReply
          ? `${actor} 追问了你的回复（问题「${payload.questionTitle ?? ""}」）`
          : `${actor} 回复了你的问题「${payload.questionTitle ?? ""}」`;
        break;
      case "fork":
        icon = <ArrowUpRight className="h-4 w-4 text-accent" />;
        text = `${actor} 把你的讨论转成了新帖《${payload.questionTitle ?? ""}》`;
        break;
      case "quote":
        icon = <MessageSquare className="h-4 w-4 text-violet-500" />;
        text = `${actor} 引用了你的回复，发布了一篇帖子`;
        break;
      case "accept":
        icon = <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        text = `${actor} 采纳了你的回复（问题「${payload.questionTitle ?? ""}」）`;
        break;
      case "star":
        icon = <Heart className="h-4 w-4 text-rose-500" />;
        text = `${actor} 点赞了你的内容`;
        break;
      case "favorite":
        icon = <Bookmark className="h-4 w-4 text-blue-500" />;
        text = `${actor} 收藏了你的内容`;
        break;
      case "follow":
        icon = <UserPlus className="h-4 w-4 text-accent" />;
        text = `${actor} 关注了你`;
        break;
      case "message":
        icon = <MessageSquare className="h-4 w-4 text-accent" />;
        text = `${actor} 给你发了一条消息：${payload.content ?? ""}`;
        break;
      case "report_result":
        icon = payload.valid ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
        text = payload.valid ? "你的举报已被确认有效，感谢你维护社区" : "你的举报被驳回";
        break;
      default:
        text = "你有新的系统通知";
    }
    const href =
      payload.type === "quote" && payload.postId
        ? `/posts/${payload.postId}`
        : payload.questionId
          ? `/question/${payload.questionId}`
          : payload.conversationId
            ? `/messages/${payload.conversationId}`
            : null;
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
        <button type="button" onClick={() => act(db.markAllNotificationsRead)} className="rounded-md border border-line px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50">全部已读</button>
      </div>
      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-400">还没有通知。有人回复、追问、转帖、引用、采纳、点赞或关注你时会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-2">{items.map(renderRow)}</div>
      )}
    </div>
  );
}
