import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { allSoftAdHits, checkContentForUser, moderationErrorMessage } from "@/lib/moderation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; rid: string }> }) {
  const { id, rid } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const review = await prisma.merchantReview.findUnique({
    where: { id: rid },
    include: { merchant: { select: { id: true, ownerId: true } } },
  });
  if (!review || review.merchantId !== id) return NextResponse.json({ error: "评价不存在" }, { status: 404 });
  const canReply = review.merchant.ownerId === user.id || user.role === "admin";
  if (!canReply) return NextResponse.json({ error: "只有商户主理人可回复评价" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const reply = String(body.reply ?? "").trim().slice(0, 500);
  if (!reply) return NextResponse.json({ error: "请填写回复内容" }, { status: 400 });
  const check = checkContentForUser(reply, user.level);
  if (!check.ok && !allSoftAdHits(check.hits)) {
    return NextResponse.json({ error: moderationErrorMessage(check) }, { status: 400 });
  }
  await prisma.merchantReview.update({
    where: { id: rid },
    data: { merchantReply: reply, merchantRepliedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
