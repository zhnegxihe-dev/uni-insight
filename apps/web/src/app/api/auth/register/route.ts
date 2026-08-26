import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { IDENTITY_ROLES } from "@/lib/core";
import { identitySeedVector, type IdentityInput } from "@/lib/recommend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const nickname = String(body.nickname ?? "").trim().slice(0, 40);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const identityRaw = body.identity && typeof body.identity === "object" ? body.identity : {};

  if (nickname.length < 1) return NextResponse.json({ error: "请填写昵称" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 });

  // 清洗身份信息（推荐冷启动种子）
  const identity: IdentityInput = {
    role: IDENTITY_ROLES.some((r) => r.key === identityRaw.role) ? String(identityRaw.role) : undefined,
    targetSchool: String(identityRaw.targetSchool ?? "").trim().slice(0, 40) || undefined,
    targetMajor: String(identityRaw.targetMajor ?? "").trim().slice(0, 40) || undefined,
    region: String(identityRaw.region ?? "").trim().slice(0, 20) || undefined,
  };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      nickname,
      email,
      passwordHash: hashPassword(password),
      identity: JSON.stringify(identity),
    },
    select: { id: true },
  });

  // 写入推荐种子画像
  const seed = identitySeedVector(identity);
  if (Object.keys(seed).length > 0) {
    await prisma.userProfile.create({ data: { userId: user.id, tagVector: JSON.stringify(seed) } });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, id: user.id });
}
