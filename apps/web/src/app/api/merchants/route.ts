import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MERCHANT_CATEGORIES } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const school = url.searchParams.get("school") ?? "";
  const city = url.searchParams.get("city") ?? "";
  const category = url.searchParams.get("category") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim();
  const where: Record<string, unknown> = { status: "active" };
  if (school) where.schoolId = school;
  if (city) where.city = city;
  if (category && MERCHANT_CATEGORIES.some((x) => x.key === category)) where.category = category;
  if (q) where.name = { contains: q };
  const merchants = await prisma.merchant.findMany({
    where,
    include: {
      school: { select: { id: true, name: true, slug: true } },
      _count: { select: { posts: { where: { status: { not: "hidden" } } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({
    ok: true,
    items: merchants.map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      tier: m.tier,
      claimStatus: m.claimStatus,
      schoolId: m.schoolId,
      city: m.city,
      address: m.address,
      description: m.description,
      school: m.school,
      postCount: m._count.posts,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 80);
  const category = String(body.category ?? "campus_food");
  const tier = body.tier === "chain" ? "chain" : "street";
  const schoolId = body.schoolId ? String(body.schoolId) : null;
  const city = body.city ? String(body.city).trim().slice(0, 50) : null;
  const address = body.address ? String(body.address).trim().slice(0, 200) : null;
  const description = body.description ? String(body.description).trim().slice(0, 500) : null;
  if (!name) return NextResponse.json({ error: "请填写商户名称" }, { status: 400 });
  if (!MERCHANT_CATEGORIES.some((x) => x.key === category)) {
    return NextResponse.json({ error: "商户分类不正确" }, { status: 400 });
  }
  if (schoolId && !(await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } }))) {
    return NextResponse.json({ error: "关联学校不存在" }, { status: 400 });
  }
  // Phase A：同名去重——已存在 active 同名商户则直接复用，避免重复建档
  const existing = await prisma.merchant.findFirst({
    where: { name, status: "active" },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ ok: true, id: existing.id, existed: true });
  const created = await prisma.merchant.create({
    data: {
      name,
      category,
      tier,
      ...(schoolId ? { schoolId } : {}),
      ...(city ? { city } : {}),
      ...(address ? { address } : {}),
      ...(description ? { description } : {}),
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
