import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id }, select: { ownerId: true } });
  if (!merchant) return NextResponse.json({ error: "商户不存在" }, { status: 404 });
  if (merchant.ownerId !== user.id && user.role !== "admin") return NextResponse.json({ error: "只有商户主理人可查看线索" }, { status: 403 });
  const leads = await prisma.merchantLead.findMany({
    where: { merchantId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ ok: true, leads });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const body = await request.json().catch(() => ({}));
  const message = String(body.message ?? "").trim().slice(0, 500);
  const contact = body.contact ? String(body.contact).trim().slice(0, 100) : null;
  const sourcePostId = body.sourcePostId ? String(body.sourcePostId) : null;
  if (!message && !contact) return NextResponse.json({ error: "请填写留言或联系方式" }, { status: 400 });
  const merchant = await prisma.merchant.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!merchant || merchant.status !== "active") return NextResponse.json({ error: "商户不存在或不可用" }, { status: 404 });
  let sourcePostAuthorId: string | null = null;
  if (sourcePostId) {
    const post = await prisma.experiencePost.findUnique({
      where: { id: sourcePostId },
      select: { authorId: true, merchantId: true, status: true },
    });
    if (post && post.merchantId === id && post.status === "visible") sourcePostAuthorId = post.authorId;
  }
  const lead = await prisma.merchantLead.create({
    data: { merchantId: id, userId: user?.id ?? null, sourcePostId, sourcePostAuthorId, contact, message },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: lead.id });
}
