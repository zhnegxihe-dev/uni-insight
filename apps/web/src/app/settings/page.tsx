import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelative, safeParse } from "@/lib/format";
import { SchoolVerifyForm } from "@/components/SchoolVerifyForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { nickname: true, email: true, bio: true, verifiedSchools: true, starScore: true, level: true, role: true, createdAt: true },
  });
  if (!profile) redirect("/login");

  const schools = safeParse<string[]>(profile.verifiedSchools, []);
  const supportedDomains = await prisma.schoolEmailDomain.findMany({
    where: { verified: true },
    include: { school: { select: { name: true } } },
    orderBy: { school: { name: "asc" } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回发现页
      </Link>

      <section className="card p-6">
        <h1 className="text-lg font-semibold text-ink">设置</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="label">昵称</p>
            <p className="text-sm font-medium text-ink">{profile.nickname}</p>
          </div>
          <div>
            <p className="label">邮箱</p>
            <p className="text-sm font-medium text-ink">{profile.email}</p>
          </div>
          <div>
            <p className="label">等级</p>
            <p className="text-sm font-medium text-ink">L{profile.level} · {profile.starScore} star</p>
          </div>
          <div>
            <p className="label">注册时间</p>
            <p className="text-sm font-medium text-ink">{formatRelative(profile.createdAt)}</p>
          </div>
        </div>
        {profile.role === "admin" && (
          <Link href="/admin" className="btn-ghost mt-4">
            <ShieldAlert className="h-4 w-4" />
            进入管理后台
          </Link>
        )}
      </section>

      <section className="card p-6">
        <SchoolVerifyForm verifiedSchools={schools} />
      </section>

      <section className="card p-6">
        <h2 className="mb-2 text-base font-semibold text-ink">支持的学校邮箱域名</h2>
        <p className="mb-3 text-sm text-zinc-500">演示库当前支持以下域名（可通过管理端扩展）：</p>
        {supportedDomains.length === 0 ? (
          <p className="text-sm text-zinc-400">暂无支持的域名</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {supportedDomains.map((domain) => (
              <span key={domain.id} className="rounded-md bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-600">
                <span className="font-medium text-zinc-800">{domain.school.name}</span> · {domain.domain}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
