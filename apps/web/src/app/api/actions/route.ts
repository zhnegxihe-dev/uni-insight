import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAction, type ActionType } from "@/lib/recommend";

const ALLOWED: ActionType[] = ["view", "search", "star", "reply", "post", "verify"];

/**
 * 行为埋点（浏览/搜索等）：
 * - 同一用户对同一 target 的 view 类行为 24h 内只记一次，避免画像被刷爆；
 * - star/reply/post 由对应业务 API 直接记录，前端无需上报。
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const actionType = String(body.actionType ?? "");
  const targetType = body.targetType ? String(body.targetType).slice(0, 30) : undefined;
  const targetId = body.targetId ? String(body.targetId).slice(0, 60) : undefined;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t)).filter(Boolean).slice(0, 20)
    : [];

  if (!ALLOWED.includes(actionType as ActionType)) {
    return NextResponse.json({ error: "行为类型不正确" }, { status: 400 });
  }

  if (actionType === "view" && targetType && targetId) {
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const recent = await prisma.userAction.findFirst({
      where: { userId: user.id, actionType: "view", targetType, targetId, createdAt: { gte: dayAgo } },
    });
    if (recent) return NextResponse.json({ ok: true, deduped: true });
  }

  await recordAction(user.id, { actionType: actionType as ActionType, targetType, targetId, tags });
  return NextResponse.json({ ok: true });
}
