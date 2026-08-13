import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const nickname = String(body.nickname ?? "").trim().slice(0, 40);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (nickname.length < 1) return NextResponse.json({ error: "请填写昵称" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });

  const user = await prisma.user.create({
    data: { nickname, email, passwordHash: hashPassword(password) },
    select: { id: true },
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true, id: user.id });
}
