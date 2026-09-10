import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "仅管理员可合并商户" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const targetId = body.targetId ? String(body.targetId) : "";
  if (!targetId || targetId === id) return NextResponse.json({ error: "请选择要合并进来的商户" }, { status: 400 });
  const [source, target] = await Promise.all([
    prisma.merchant.findUnique({ where: { id }, select: { id: true, name: true, status: true } }),
    prisma.merchant.findUnique({ where: { id: targetId }, select: { id: true, name: true, status: true } }),
  ]);
  if (!source || source.status === "removed" || !target || target.status === "removed") {
    return NextResponse.json({ error: "商户不存在或已合并" }, { status: 404 });
  }
  const targetReviews = await prisma.merchantReview.findMany({ where: { merchantId: targetId } });
  let movedReviews = 0;
  let skippedReviews = 0;
  for (const r of targetReviews) {
    const dup = await prisma.merchantReview.findUnique({
      where: { merchantId_authorId: { merchantId: id, authorId: r.authorId } },
    });
    if (dup) { skippedReviews++; continue; }
    await prisma.merchantReview.update({ where: { id: r.id }, data: { merchantId: id } });
    movedReviews++;
  }
  const movedPosts = await prisma.experiencePost.updateMany({
    where: { merchantId: targetId },
    data: { merchantId: id, merchantName: source.name },
  });
  await prisma.merchant.update({ where: { id: targetId }, data: { status: "removed" } });
  return NextResponse.json({ ok: true, movedPosts: movedPosts.count, movedReviews, skippedReviews });
}
