import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { notify, toggleFollow } from "@/lib/social";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;

  if (id === user.id) return NextResponse.json({ error: "不能关注自己" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, nickname: true } });
  if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const result = await toggleFollow(user.id, id);
  if (result.following) {
    await notify(id, "follow", { type: "follow", actorId: user.id, actorName: user.nickname });
  }
  return NextResponse.json(result);
}
