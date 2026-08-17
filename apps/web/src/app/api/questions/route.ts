import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/core";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

function slugify(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `t-${ascii || Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim().slice(0, 150);
  const description = body.description ? String(body.description).trim().slice(0, 300) : null;
  const scenarioType = String(body.scenarioType ?? "gaokao");
  const degreeLevel = String(body.degreeLevel ?? "bachelor");
  const tagNames = Array.isArray(body.tagNames)
    ? body.tagNames.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 5)
    : [];
  const scenarioMeta = body.scenarioMeta && typeof body.scenarioMeta === "object" ? body.scenarioMeta : {};

  if (!title) return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  if (!SCENARIOS.some((s) => s.type === scenarioType)) {
    return NextResponse.json({ error: "场景类型不正确" }, { status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      title,
      description,
      authorId: user.id,
      scenarioType,
      degreeLevel,
      scenarioMeta: JSON.stringify(scenarioMeta),
    },
  });

  for (const name of tagNames) {
    const existing = await prisma.tag.findFirst({ where: { name } });
    const tag =
      existing ??
      (await prisma.tag.create({
        data: { name, slug: slugify(name), type: "custom" },
      }));
    await prisma.questionTag.create({
      data: { questionId: question.id, tagId: tag.id },
    });
  }

  return NextResponse.json({ ok: true, id: question.id });
}
