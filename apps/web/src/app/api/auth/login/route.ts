import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }
  if (user.status !== "active") {
    return NextResponse.json({ error: "账号已被禁用" }, { status: 403 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
