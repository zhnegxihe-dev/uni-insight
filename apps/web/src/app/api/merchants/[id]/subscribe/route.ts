import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MERCHANT_PLANS } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id }, select: { id: true, ownerId: true } });
  if (!merchant) return NextResponse.json({ error: "商户不存在" }, { status: 404 });
  if (merchant.ownerId !== user.id && user.role !== "admin") return NextResponse.json({ error: "只有商户主理人可升级套餐" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const plan = String(body.plan ?? "");
  if (!MERCHANT_PLANS.some((p) => p.key === plan)) return NextResponse.json({ error: "套餐不正确" }, { status: 400 });
  // 演示环境：未接入支付，选择后直接开通 365 天；生产接入支付回调后再生效
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await prisma.merchant.update({
    where: { id },
    data: plan === "free" ? { plan, planExpiresAt: null } : { plan, planExpiresAt: expires, tier: "chain" },
  });
  return NextResponse.json({ ok: true, plan });
}
