import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recomputeUserStar, starTarget } from "@/lib/star";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return NextResponse.json({ error: "问题不存在" }, { status: 404 });

  const result = await starTarget(user.id, "question", id);
  await recomputeUserStar(question.authorId);
  return NextResponse.json(result);
}
