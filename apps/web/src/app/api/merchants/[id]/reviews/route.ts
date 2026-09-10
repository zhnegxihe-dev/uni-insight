import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MERCHANT_REVIEW_DIMS } from "@/lib/core";
import { allSoftAdHits, checkContentForUser, moderationErrorMessage } from "@/lib/moderation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const rating = Number(body.rating);
  const content = String(body.content ?? "").trim().slice(0, 2000);
  const isAnonymous = Boolean(body.isAnonymous);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "请选择 1-5 星总评" }, { status: 400 });
  if (content.length < 5) return NextResponse.json({ error: "评价内容至少 5 个字" }, { status: 400 });
  const merchant = await prisma.merchant.findUnique({ where: { id }, select: { id: true, category: true, status: true } });
  if (!merchant || merchant.status !== "active") return NextResponse.json({ error: "商户不存在或不可用" }, { status: 404 });
  const allowed = MERCHANT_REVIEW_DIMS[merchant.category] ?? [];
  const rawDims = body.dims && typeof body.dims === "object" ? (body.dims as Record<string, unknown>) : {};
  const dims: Record<string, number> = {};
  for (const d of allowed) {
    const v = Number(rawDims[d.key]);
    if (Number.isFinite(v) && v >= 1 && v <= 5) dims[d.key] = Math.round(v);
  }
  const check = checkContentForUser(content, user.level);
  if (!check.ok && !allSoftAdHits(check.hits)) {
    return NextResponse.json({ error: moderationErrorMessage(check) }, { status: 400 });
  }
  const existing = await prisma.merchantReview.findUnique({
    where: { merchantId_authorId: { merchantId: id, authorId: user.id } },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ error: "你已经评价过该商户了" }, { status: 400 });
  const review = await prisma.merchantReview.create({
    data: { merchantId: id, authorId: user.id, rating, dims: JSON.stringify(dims), content, isAnonymous },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: review.id });
}
