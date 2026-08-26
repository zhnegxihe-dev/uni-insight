import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getConversationDetail, markConversationRead } from "@/lib/social";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const detail = await getConversationDetail(user.id, id);
  if (!detail) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  await markConversationRead(user.id, id);
  return NextResponse.json({ ok: true, ...detail });
}
