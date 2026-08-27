import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PostForm } from "./PostForm";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [schools, majors, courses, teachers] = await Promise.all([
    prisma.school.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.major.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.course.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: "asc" }, take: 200 }),
    prisma.teacher.findMany({ select: { id: true, name: true, title: true }, orderBy: { name: "asc" }, take: 200 }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">写经验帖 / 避雷帖</h1>
        <p className="mt-1 text-sm text-zinc-500">分享一段真实经历，或提醒后来人避开的坑。认证身份会更可信。</p>
      </div>
      <PostForm schools={schools} majors={majors} courses={courses} teachers={teachers} />
    </div>
  );
}