import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id }, select: { id: true, claimStatus: true, status: true } });
  if (!merchant || merchant.status !== "active") return NextResponse.json({ error: "商户不存在或不可用" }, { status: 404 });
  if (merchant.claimStatus === "claimed") return NextResponse.json({ error: "该商户已被认领" }, { status: 400 });
  // Phase B：即时认领（资质复核与驳回留待后台审核队列，Phase C 完善）
  await prisma.merchant.update({ where: { id }, data: { claimStatus: "claimed", ownerId: user.id } });
  return NextResponse.json({ ok: true });
}
