import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PostForm } from "./PostForm";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; merchant?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const initialType = sp.type && ["experience", "avoid", "promo"].includes(sp.type) ? sp.type : undefined;

  const [schools, majors, courses, teachers, merchantRows] = await Promise.all([
    prisma.school.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.major.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.course.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: "asc" }, take: 200 }),
    prisma.teacher.findMany({ select: { id: true, name: true, title: true }, orderBy: { name: "asc" }, take: 200 }),
    prisma.merchant.findMany({
      where: { status: "active" },
      include: { school: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);
  const merchants = merchantRows.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    tier: m.tier,
    schoolName: m.school?.name ?? null,
  }));
  const initialMerchantId = sp.merchant && merchants.some((m) => m.id === sp.merchant) ? sp.merchant : "";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">写经验帖 / 避雷帖 / 推广帖</h1>
        <p className="mt-1 text-sm text-zinc-500">分享一段真实经历或推荐一个宝藏去处；受商家委托的推广请选择「推广帖」并明示商户。</p>
      </div>
      <PostForm
        schools={schools}
        majors={majors}
        courses={courses}
        teachers={teachers}
        merchants={merchants}
        initialType={initialType}
        initialMerchantId={initialMerchantId}
      />
    </div>
  );
}
