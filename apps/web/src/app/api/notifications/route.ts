import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeParse } from "@/lib/format";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const actorIds = Array.from(
    new Set(notifications.map((n) => (safeParse<Record<string, unknown>>(n.payload, {}).actorId as string) ?? "").filter(Boolean))
  );
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, nickname: true } })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a.nickname]));

  return NextResponse.json({
    ok: true,
    unread,
    items: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      payload: safeParse<Record<string, unknown>>(n.payload, {}),
      actorName: actorMap.get(safeParse<Record<string, unknown>>(n.payload, {}).actorId as string) ?? "",
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  });
}
