import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Flag, ShieldCheck, UserX } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";
import { REPORT_REASONS, REPORT_TARGET_LABEL, type ReportTargetType } from "@/lib/reports";
import { AdminReportActions } from "@/components/AdminReportActions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const [openReports, pendingCount] = await Promise.all([
    prisma.report.findMany({
      where: { status: "open" },
      include: {
        reporter: { select: { id: true, nickname: true, email: true, starScore: true, level: true, status: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.report.count({ where: { status: "open" } }),
  ]);

  const ids = {
    question: openReports.filter((r) => r.targetType === "question").map((r) => r.targetId),
    reply: openReports.filter((r) => r.targetType === "reply").map((r) => r.targetId),
    review: openReports.filter((r) => r.targetType === "review").map((r) => r.targetId),
    ai_post: openReports.filter((r) => r.targetType === "ai_post").map((r) => r.targetId),
    experience_post: openReports.filter((r) => r.targetType === "experience_post").map((r) => r.targetId),
  };

  const [questions, replies, reviews, aiPosts, experiencePosts] = await Promise.all([
    ids.question.length
      ? prisma.question.findMany({ where: { id: { in: ids.question } }, select: { id: true, title: true, status: true, authorId: true } })
      : [],
    ids.reply.length
      ? prisma.reply.findMany({ where: { id: { in: ids.reply } }, select: { id: true, content: true, status: true, authorId: true, questionId: true } })
      : [],
    ids.review.length
      ? prisma.review.findMany({ where: { id: { in: ids.review } }, select: { id: true, content: true, status: true, authorId: true } })
      : [],
    ids.ai_post.length
      ? prisma.aiPost.findMany({ where: { id: { in: ids.ai_post } }, select: { id: true, title: true, status: true, authorId: true } })
      : [],
    ids.experience_post.length
      ? prisma.experiencePost.findMany({ where: { id: { in: ids.experience_post } }, select: { id: true, title: true, status: true, authorId: true } })
      : [],
  ]);

  const contentMap = new Map<string, { preview: string; status: string; authorId: string; questionId?: string }>();
  for (const row of questions) contentMap.set(`question:${row.id}`, { preview: row.title, status: row.status, authorId: row.authorId });
  for (const row of replies) contentMap.set(`reply:${row.id}`, { preview: row.content, status: row.status, authorId: row.authorId, questionId: row.questionId });
  for (const row of reviews) contentMap.set(`review:${row.id}`, { preview: row.content ?? "", status: row.status, authorId: row.authorId });
  for (const row of aiPosts) contentMap.set(`ai_post:${row.id}`, { preview: row.title, status: row.status, authorId: row.authorId });
  for (const row of experiencePosts) contentMap.set(`experience_post:${row.id}`, { preview: row.title, status: row.status, authorId: row.authorId });

  const reasonLabel = new Map<string, string>(REPORT_REASONS.map((r) => [r.key, r.label]));
  const statusLabel: Record<string, string> = { visible: "正常", folded: "已折叠", hidden: "已隐藏" };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />
        返回发现页
      </Link>

      <section className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-ink">管理后台</h1>
              <p className="text-sm text-zinc-500">举报审核队列（反中介与内容治理）</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
            <Flag className="h-4 w-4" />
            待处理 {pendingCount} 条
          </span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">举报队列</h2>
        {openReports.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-zinc-400">队列已清空，暂无待处理举报 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openReports.map((report) => {
              const target = contentMap.get(`${report.targetType}:${report.targetId}`);
              const type = report.targetType as ReportTargetType;
              const href =
                type === "question"
                  ? `/question/${report.targetId}`
                  : type === "ai_post"
                    ? `/post/${report.targetId}`
                    : type === "experience_post"
                      ? `/posts/${report.targetId}`
                    : type === "reply" && target?.questionId
                      ? `/question/${target.questionId}`
                      : null;
              return (
                <article key={report.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="rounded bg-red-50 px-1.5 py-0.5 font-medium text-red-600">
                          {reasonLabel.get(report.reason) ?? report.reason}
                        </span>
                        <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-zinc-600">
                          {REPORT_TARGET_LABEL[type] ?? type}
                        </span>
                        <span className="text-zinc-400">
                          内容状态：{statusLabel[target?.status ?? ""] ?? target?.status}
                        </span>
                        <span className="ml-auto">{formatRelative(report.createdAt)}</span>
                      </div>
                      {href ? (
                        <Link href={href} className="block text-sm font-medium text-ink hover:text-accent">
                          {target?.preview || "(内容已删除)"}
                        </Link>
                      ) : (
                        <p className="text-sm text-ink">{target?.preview || "(内容已删除)"}</p>
                      )}
                      {report.detail && (
                        <p className="mt-1 text-xs text-zinc-500">补充说明：{report.detail}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <UserX className="h-3.5 w-3.5 text-zinc-400" />
                          举报者：{report.reporter.nickname}（L{report.reporter.level}）
                        </span>
                        <span>内容作者 ID：{target?.authorId ? target.authorId.slice(0, 8) : "-"}</span>
                      </div>
                    </div>
                    <AdminReportActions reportId={report.id} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
