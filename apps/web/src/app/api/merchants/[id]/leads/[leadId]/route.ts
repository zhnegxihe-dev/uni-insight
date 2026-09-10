import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PLATFORM_COMMISSION_RATE, PROMOTER_COMMISSION_RATE } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; leadId: string }> }) {
  const { id, leadId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id }, select: { id: true, ownerId: true } });
  if (!merchant) return NextResponse.json({ error: "商户不存在" }, { status: 404 });
  if (merchant.ownerId !== user.id && user.role !== "admin") return NextResponse.json({ error: "只有商户主理人可管理线索" }, { status: 403 });
  const lead = await prisma.merchantLead.findUnique({ where: { id: leadId } });
  if (!lead || lead.merchantId !== id) return NextResponse.json({ error: "线索不存在" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const status = String(body.status ?? "");
  if (!["new", "contacted", "deal", "cancelled"].includes(status)) return NextResponse.json({ error: "线索状态不正确" }, { status: 400 });
  const dealAmount = status === "deal" ? Math.max(0, Math.round(Number(body.dealAmount) || 0)) : null;
  if (status === "deal" && (!dealAmount || dealAmount <= 0)) return NextResponse.json({ error: "请填写成交金额（元）" }, { status: 400 });
  await prisma.merchantLead.update({
    where: { id: leadId },
    data: { status, dealAmount, dealAt: status === "deal" ? new Date() : null },
  });
  if (status === "deal") {
    const existing = await prisma.merchantCommission.count({ where: { leadId } });
    if (existing === 0) {
      const platformAmount = Math.round(dealAmount! * PLATFORM_COMMISSION_RATE);
      await prisma.merchantCommission.create({
        data: { merchantId: id, leadId, beneficiaryId: null, kind: "platform", amount: platformAmount, baseAmount: dealAmount!, rate: PLATFORM_COMMISSION_RATE },
      });
      if (lead.sourcePostAuthorId && lead.sourcePostAuthorId !== merchant.ownerId) {
        const promoterAmount = Math.round(dealAmount! * PROMOTER_COMMISSION_RATE);
        await prisma.merchantCommission.create({
          data: { merchantId: id, leadId, beneficiaryId: lead.sourcePostAuthorId, kind: "promoter", amount: promoterAmount, baseAmount: dealAmount!, rate: PROMOTER_COMMISSION_RATE },
        });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
