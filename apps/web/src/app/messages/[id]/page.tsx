import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, safeParse } from "@/lib/format";
import { getConversationDetail, markConversationRead } from "@/lib/social";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { MessageComposer } from "@/components/MessageComposer";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const detail = await getConversationDetail(user.id, id);
  if (!detail) notFound();
  await markConversationRead(user.id, id);

  const schools = safeParse<string[]>(detail.other.verifiedSchools, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center gap-2">
        <Link href="/messages" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          会话
        </Link>
      </div>

      <div className="card flex flex-col overflow-hidden" style={{ minHeight: "480px" }}>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
            {detail.other.nickname.slice(0, 1)}
          </span>
          <Link href={`/user/${detail.other.id}`} className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent">
            {detail.other.nickname}
            <VerifiedBadge schools={schools} />
          </Link>
          {detail.mutual && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-accent">互相关注</span>}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50/60 p-4" style={{ maxHeight: "420px" }}>
          {detail.messages.length === 0 ? (
            <p className="pt-10 text-center text-sm text-zinc-400">开始你们的对话吧</p>
          ) : (
            detail.messages.map((message) => {
              const mine = message.senderId === user.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      mine ? "rounded-br-sm bg-accent text-white" : "rounded-bl-sm border border-line bg-white text-ink"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`mt-1 text-[11px] ${mine ? "text-blue-100" : "text-zinc-400"}`}>
                      {formatRelative(message.createdAt)}
                      {mine && message.readAt && " · 已读"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <MessageComposer toUserId={detail.other.id} toNickname={detail.other.nickname} mutual={detail.mutual} />
      </div>
    </div>
  );
}
