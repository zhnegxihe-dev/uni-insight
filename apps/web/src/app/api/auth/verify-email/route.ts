import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeUserStar } from "@/lib/star";

/**
 * 学校邮箱认证（演示模式）：
 * 不真实发送验证邮件，直接校验邮箱域名是否在 school_email_domains 表中，
 * 匹配即完成认证，学校名写入 verifiedSchools。
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }

  const domain = email.split("@")[1];
  const entry = await prisma.schoolEmailDomain.findUnique({
    where: { domain },
    include: { school: { select: { name: true } } },
  });

  if (!entry || !entry.verified) {
    const domains = await prisma.schoolEmailDomain.findMany({
      where: { verified: true },
      select: { domain: true, school: { select: { name: true } } },
      orderBy: { domain: "asc" },
    });
    return NextResponse.json(
      {
        error: `该邮箱域名暂不支持认证，请使用学校邮箱（如 ${domains.slice(0, 3).map((d) => d.domain).join("、")}）`,
      },
      { status: 400 }
    );
  }

  const current = [...user.verifiedSchools];
  if (!current.includes(entry.school.name)) {
    current.push(entry.school.name);
    await prisma.user.update({
      where: { id: user.id },
      data: { verifiedSchools: JSON.stringify(current) },
    });
  }

  const { score, level } = await recomputeUserStar(user.id);
  return NextResponse.json({
    ok: true,
    school: entry.school.name,
    verifiedSchools: current,
    starScore: score,
    level,
    message: `已认证「${entry.school.name}」，+20 积分（一次性奖励）`,
  });
}
