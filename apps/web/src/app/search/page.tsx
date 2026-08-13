import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [questions, schools, majors] = await Promise.all([
    query
      ? prisma.question.findMany({
          where: { OR: [{ title: { contains: query } }, { description: { contains: query } }] },
          select: { id: true, title: true, replyCount: true, starCount: true },
          take: 10,
        })
      : [],
    query
      ? prisma.school.findMany({
          where: { OR: [{ name: { contains: query } }, { description: { contains: query } }] },
          select: { id: true, name: true, slug: true, region: true },
          take: 5,
        })
      : [],
    query
      ? prisma.major.findMany({
          where: { name: { contains: query } },
          select: { id: true, name: true, slug: true },
          take: 5,
        })
      : [],
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">搜索</h1>
        <p className="mt-1 text-sm text-zinc-500">{query ? `“${query}” 的结果` : "输入关键词开始搜索"}</p>
      </div>

      {schools.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-600">学校</h2>
          <div className="space-y-2">
            {schools.map((school) => (
              <Link key={school.id} href={`/?scenario=all&q=${encodeURIComponent(school.name)}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{school.name}</p>
                <p className="text-xs text-zinc-400">{school.region || "暂无地区信息"}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {majors.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-600">专业</h2>
          <div className="space-y-2">
            {majors.map((major) => (
              <Link key={major.id} href={`/?scenario=all&q=${encodeURIComponent(major.name)}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{major.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-600">问题</h2>
        {questions.length === 0 ? (
          <p className="text-sm text-zinc-400">没有找到相关问题</p>
        ) : (
          <div className="space-y-2">
            {questions.map((question) => (
              <Link key={question.id} href={`/question/${question.id}`} className="card block px-4 py-3 hover:border-zinc-300">
                <p className="text-sm font-medium text-ink">{question.title}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {question.starCount} star · {question.replyCount} 回复
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
