import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCircle2, MessageSquare, Sparkles, Star, UserPlus, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { MarkAllReadButton } from "@/components/MarkAllReadButton";

export const dynamic = "force-dynamic";

interface NotificationItem {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  actorName: string;
  readAt: Date | null;
  createdAt: Date;
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const payload = item.payload;
  const sub = payload.type === "message" ? "message" : item.type;
  const href =
    payload.questionId && typeof payload.questionId === "string"
      ? `/question/${payload.questionId}`
      : payload.conversationId && typeof payload.conversationId === "string"
        ? `/messages/${payload.conversationId}`
        : payload.postId && typeof payload.postId === "string"
          ? `/post/${payload.postId}`
          : payload.actorId && typeof payload.actorId === "string"
            ? `/user/${payload.actorId}`
            : null;

  let icon = <Bell className="h-4 w-4 text-zinc-400" />;
  let text = "";
  switch (sub) {
    case "reply":
      icon = <MessageSquare className="h-4 w-4 text-accent" />;
      text = `${item.actorName} 回复了你的问题「${String(payload.questionTitle ?? "")}」`;
      break;
    case "accept":
      icon = <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      text = `${item.actorName} 采纳了你的回复（问题「${String(payload.questionTitle ?? "")}」）`;
      break;
    case "star":
      icon = <Star className="h-4 w-4 text-amber-500" />;
      text = `${item.actorName} 点亮了你的${payload.questionId ? "提问" : payload.postId ? "AI 精选帖" : "回复"}`;
      break;
    case "follow":
      icon = <UserPlus className="h-4 w-4 text-accent" />;
      text = `${item.actorName} 关注了你`;
      break;
    case "report_result":
      icon = payload.valid ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
      text = payload.valid ? "你的举报已被确认有效，感谢你维护社区（+5 star）" : "你的举报被驳回（-10 star），请勿恶意举报";
      break;
    case "message":
      icon = <MessageSquare className="h-4 w-4 text-accent" />;
      text = `${item.actorName} 给你发了一条消息：${String(payload.content ?? "")}`;
      break;
    default:
      text = "你有新的系统通知";
  }

  const body = (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed text-ink">{text}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{formatRelative(item.createdAt)}</p>
      </div>
      {!item.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
    </div>
  );

  return href ? (
    <Link href={href} className="card block p-4 transition hover:border-zinc-300">
      {body}
    </Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const actorIds = Array.from(
    new Set(
      notifications
        .map((n) => (safeParse<Record<string, unknown>>(n.payload, {}).actorId as string) ?? "")
        .filter(Boolean)
    )
  );
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, nickname: true } })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a.nickname]));

  const items: NotificationItem[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    payload: safeParse<Record<string, unknown>>(n.payload, {}),
    actorName: actorMap.get(String(safeParse<Record<string, unknown>>(n.payload, {}).actorId ?? "")) ?? "有人",
    readAt: n.readAt,
    createdAt: n.createdAt,
  }));
  const unread = items.filter((i) => !i.readAt).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-semibold text-ink">通知</h1>
          {unread > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">{unread} 未读</span>
          )}
        </div>
        <MarkAllReadButton />
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-400">还没有通知。有人回复、采纳、点亮或关注你时会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
