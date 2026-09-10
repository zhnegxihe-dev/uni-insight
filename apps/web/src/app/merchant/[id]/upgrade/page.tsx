import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanPicker } from "@/components/PlanPicker";

export const dynamic = "force-dynamic";

export default async function MerchantUpgradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return <div className="card mx-auto max-w-3xl p-10 text-center text-sm text-zinc-500"><Link href="/login" className="text-accent hover:underline">登录</Link> 后管理套餐</div>;
  }
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    select: { id: true, name: true, ownerId: true, plan: true },
  });
  if (!merchant) notFound();
  if (merchant.ownerId !== user.id && user.role !== "admin") {
    return <div className="card mx-auto max-w-3xl p-10 text-center text-sm text-zinc-500">只有商户主理人可管理套餐</div>;
  }
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/merchant/${merchant.id}/dashboard`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-accent">
        <ChevronLeft className="h-4 w-4" />返回商户后台
      </Link>
      <div>
        <h1 className="text-xl font-semibold text-ink">{merchant.name} · 品牌馆入驻</h1>
        <p className="mt-1 text-sm text-zinc-500">大商家认证入驻与曝光权益；路边小店可继续免费使用基础功能。</p>
      </div>
      <PlanPicker merchantId={merchant.id} currentPlan={merchant.plan} />
    </div>
  );
}
