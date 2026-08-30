import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { formatRelative, safeParse } from "@/lib/format";
import { Highlight } from "@/components/Highlight";
import { TrackView } from "@/components/TrackView";
import { parseSearchQuery } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [questions, schools, majors, courses, teachers, posts, experiencePosts] = await Promise.all([
    query
      ? prisma.question.findMany({
          where: { status: { not: "hidden" }, OR: [{ title: { contains: query } }, { description: { contains: query } }] },
          select: { id: true, title: true, description: true, replyCount: true, starCount: true, favoriteCount: true },
          orderBy: [{ starCount: "desc" }, { createdAt: "desc" }],
          take: 10,
        })
      : [],
    query
      ? prisma.school.findMany({
          where: { OR: [{ name: { contains: query } }, { description: { contains: query } }] },
          select: { id: true, name: true, slug: true, region: true, description: true },
          take: 5,
        })
      : [],
    query
      ? prisma.major.findMany({
          where: { OR: [{ name: { contains: query } }, { category: { contains: query } }] },
          select: { id: true, name: true, slug: true, category: true },
          take: 5,
        })
      : [],
    query
      ? prisma.course.findMany({
          where: { OR: [{ name: { contains: query } }, { code: { contains: query } }] },
          include: { school: { select: { id: true, name: true, slug: true } } },
          take: 6,
        })
      : [],
    query
      ? prisma.teacher.findMany({
          where: { OR: [{ name: { contains: query } }, { department: { contains: query } }] },
          include: { school: { select: { id: true, name: true, slug: true } } },
          take: 6,
        })
      : [],
    query
      ? prisma.aiPost.findMany({
          where: {
            status: "published",
            OR: [{ title: { contains: query } }, { summaryJson: { contains: query } }],
          },
          select: {
            id: true,
            title: true,
            summaryJson: true,
            starCount: true,
            favoriteCount: true,
            createdAt: true,
            author: { select: { nickname: true } },
          },
          orderBy: [{ starCount: "desc" }, { createdAt: "desc" }],
          take: 6,
        })
      : [],
    query
      ? prisma.experiencePost.findMany({
          where: { status: { not: "hidden" }, postType: { not: "promo" }, OR: [{ title: { contains: query } }, { content: { contains: query } }] },
          select: {
            id: true,
            title: true,
            content: true,
            postType: true,
            likeCount: true,
            favoriteCount: true,
            createdAt: true,
            author: { select: { nickname: true } },
          },
          orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
          take: 6,
        })
      : [],
  ]);

  const total = questions.length + schools.length + majors.length + courses.length + teachers.length + posts.length + experiencePosts.length;
  const searchTags = query ? await parseSearchQuery(query) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {query && <TrackView actionType="search" targetType="search" targetId={query} tags={searchTags} />}
      <div>
        <h1 className="text-xl font-semibold text-ink">搜索</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {query ? `“${query}” 找到 ${total} 条结果` : "输入关键词开始搜索"}
        </p>
      </div>

      {query && total === 0 && (
        <div className="card p-8 text-center text-sm text-zinc-400">没有找到相关内容，换个关键词试试</div>
      )}

      <Group title="学校" count={schools.length}>
        {schools.map((school) => (
          <Link key={school.id} href={`/school/${school.slug}`} className="card block px-4 py-3 hover:border-zinc-300">
            <p className="text-sm font-medium text-ink">
              <Highlight text={school.name} query={query} />
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {school.region || "地区未知"} ·{" "}
              <Highlight text={school.description ?? "查看学校档案与评价"} query={query} />
            </p>
          </Link>
        ))}
      </Group>

      <Group title="专业" count={majors.length}>
        {majors.map((major) => (
          <Link key={major.id} href={`/major/${major.slug}`} className="card block px-4 py-3 hover:border-zinc-300">
            <p className="text-sm font-medium text-ink">
              <Highlight text={major.name} query={query} />
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {major.category ? <Highlight text={major.category} query={query} /> : "专业档案"}
              {" · 查看跨校对比"}
            </p>
          </Link>
        ))}
      </Group>

      <Group title="课程" count={courses.length}>
        {courses.map((course) => (
          <Link key={course.id} href={`/course/${course.id}`} className="card block px-4 py-3 hover:border-zinc-300">
            <p className="text-sm font-medium text-ink">
              <Highlight text={course.name} query={query} />
              {course.code ? <span className="ml-1.5 text-xs font-normal text-zinc-400">{course.code}</span> : null}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              <Highlight text={course.school.name} query={query} /> · 查看课程评价
            </p>
          </Link>
        ))}
      </Group>

      <Group title="教师" count={teachers.length}>
        {teachers.map((teacher) => (
          <Link key={teacher.id} href={`/teacher/${teacher.id}`} className="card block px-4 py-3 hover:border-zinc-300">
            <p className="text-sm font-medium text-ink">
              <Highlight text={teacher.name} query={query} />
              {teacher.title ? <span className="ml-1.5 text-xs font-normal text-zinc-400">{teacher.title}</span> : null}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {teacher.department ? <Highlight text={teacher.department} query={query} /> : "院系未知"} ·{" "}
              <Highlight text={teacher.school.name} query={query} />
            </p>
          </Link>
        ))}
      </Group>

      <Group title="AI 精选帖" count={posts.length}>
        {posts.map((post) => {
          const summary = safeParse<Record<string, unknown>>(post.summaryJson, {});
          const overview = typeof summary.overview === "string" ? summary.overview : "";
          return (
            <Link key={post.id} href={`/post/${post.id}`} className="card block px-4 py-3 hover:border-zinc-300">
              <p className="text-sm font-medium text-ink">
                <Highlight text={post.title} query={query} />
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {overview ? <Highlight text={overview} query={query} /> : "AI 整合的真实经验总结"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {post.author.nickname} · {post.starCount} 点赞 · {post.favoriteCount} 收藏 · {formatRelative(post.createdAt)}
              </p>
            </Link>
          );
        })}
      </Group>

      <Group title="经验帖" count={experiencePosts.length}>
        {experiencePosts.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} className="card block px-4 py-3 hover:border-zinc-300">
            <p className="text-sm font-medium text-ink">
              <span className={post.postType === "avoid" ? "mr-1.5 rounded bg-red-50 px-1 py-0.5 text-[11px] font-medium text-red-600" : "mr-1.5 rounded bg-blue-50 px-1 py-0.5 text-[11px] font-medium text-accent"}>
                {post.postType === "avoid" ? "避雷帖" : "经验帖"}
              </span>
              <Highlight text={post.title} query={query} />
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
              <Highlight text={post.content} query={query} />
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {post.author.nickname} · {post.likeCount} 点赞 · {post.favoriteCount} 收藏 · {formatRelative(post.createdAt)}
            </p>
          </Link>
        ))}
      </Group>

      <Group title="问题" count={questions.length}>
        {questions.map((question) => (
          <Link key={question.id} href={`/question/${question.id}`} className="card block px-4 py-3 hover:border-zinc-300">
            <p className="text-sm font-medium text-ink">
              <Highlight text={question.title} query={query} />
            </p>
            {question.description && (
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                <Highlight text={question.description} query={query} />
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-400">
              {question.starCount} 点赞 · {question.favoriteCount} 收藏 · {question.replyCount} 回复
            </p>
          </Link>
        ))}
      </Group>
    </div>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-zinc-600">
        {title} <span className="ml-1 font-normal text-zinc-400">{count}</span>
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
