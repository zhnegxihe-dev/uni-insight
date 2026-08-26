import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getConversationList, sendMessage } from "@/lib/social";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const items = await getConversationList(user.id);
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const toUserId = String(body.toUserId ?? "");
  const content = String(body.content ?? "");

  if (!toUserId) return NextResponse.json({ error: "缺少接收人" }, { status: 400 });

  const result = await sendMessage(user.id, toUserId, content);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, limited: result.limited },
      { status: result.limited ? 403 : 400 }
    );
  }
  return NextResponse.json({ ok: true, id: result.messageId, limited: result.limited });
}
