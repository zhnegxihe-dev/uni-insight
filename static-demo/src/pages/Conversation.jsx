import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useDb, act } from "../store";
import * as db from "../db";
import { VerifiedBadge } from "../components";

export default function Conversation() {
  const { id } = useParams();
  const state = useDb();
  const user = db.getCurrentUser(state);
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState(null);

  const conv = db.getConversation(state, id);
  if (!user) return <div className="card p-10 text-center text-sm text-zinc-400">请先登录查看消息</div>;
  if (!conv) return <div className="card p-10 text-center text-sm text-zinc-400">会话不存在</div>;

  const schools = JSON.parse(conv.other?.verifiedSchools || "[]");

  function send() {
    const text = content.trim();
    if (!text) return;
    try {
      const res = act(db.sendMessage, conv.other.id, text);
      setContent("");
      setFeedback(null);
    } catch (e) {
      setFeedback({ type: "error", text: e.message });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3">
        <Link to="/messages" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
          <ArrowLeft className="h-4 w-4" />会话
        </Link>
      </div>

      <div className="card flex flex-col overflow-hidden" style={{ minHeight: "480px" }}>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
            {conv.other?.nickname?.slice(0, 1)}
          </span>
          <Link to={`/user/${conv.other?.id}`} className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent">
            {conv.other?.nickname}
            <VerifiedBadge schools={schools} />
          </Link>
          {conv.mutual && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-accent">互相关注</span>}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50/60 p-4" style={{ maxHeight: "420px" }}>
          {conv.messages.length === 0 ? (
            <p className="pt-10 text-center text-sm text-zinc-400">开始你们的对话吧</p>
          ) : (
            conv.messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    mine ? "rounded-br-sm bg-accent text-white" : "rounded-bl-sm border border-line bg-white text-ink"
                  }`}>
                    <p>{m.content}</p>
                    <p className={`mt-1 text-[11px] ${mine ? "text-blue-100" : "text-zinc-400"}`}>
                      {db.formatRelative(m.createdAt)}
                      {mine && m.readAt && " · 已读"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-line bg-white p-3">
          {!conv.mutual && (
            <p className="mb-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
              你们还未互相关注，每人只能发送一条打招呼消息。互相关注后即可畅聊。
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`给 ${conv.other?.nickname} 发消息…`}
              className="input flex-1"
            />
            <button type="button" onClick={send} disabled={!content.trim()} className="btn-primary shrink-0">
              <Send className="h-4 w-4" />发送
            </button>
          </div>
          {feedback && <p className="mt-1.5 text-xs text-red-500">{feedback.text}</p>}
        </div>
      </div>
    </div>
  );
}
