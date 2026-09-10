import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REPORT_REASONS, REPORT_TARGET_LABEL, type ReportTargetType } from "@/lib/reports";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "无权访问管理后台" }, { status: 403 });

  const reports = await prisma.report.findMany({
    where: { status: "open" },
    include: {
      reporter: { select: { id: true, nickname: true, email: true, starScore: true, level: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // 批量拉取被举报内容预览
  const ids = {
    question: [] as string[],
    reply: [] as string[],
    review: [] as string[],
    ai_post: [] as string[],
    experience_post: [] as string[],
    merchant_review: [] as string[],
  };
  for (const report of reports) {
    const type = report.targetType as ReportTargetType;
    if (ids[type]) ids[type].push(report.targetId);
  }

  const [questions, replies, reviews, aiPosts, experiencePosts, merchantReviews] = await Promise.all([
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
    ids.merchant_review.length
      ? prisma.merchantReview.findMany({ where: { id: { in: ids.merchant_review } }, select: { id: true, content: true, status: true, authorId: true } })
      : [],
  ]);

  const contentMap = new Map<string, { preview: string; status: string; authorId: string; questionId?: string }>();
  for (const row of questions) contentMap.set(`question:${row.id}`, { preview: row.title, status: row.status, authorId: row.authorId });
  for (const row of replies) contentMap.set(`reply:${row.id}`, { preview: row.content, status: row.status, authorId: row.authorId, questionId: row.questionId });
  for (const row of reviews) contentMap.set(`review:${row.id}`, { preview: row.content ?? "", status: row.status, authorId: row.authorId });
  for (const row of aiPosts) contentMap.set(`ai_post:${row.id}`, { preview: row.title, status: row.status, authorId: row.authorId });
  for (const row of experiencePosts) contentMap.set(`experience_post:${row.id}`, { preview: row.title, status: row.status, authorId: row.authorId });
  for (const row of merchantReviews) contentMap.set(`merchant_review:${row.id}`, { preview: row.content, status: row.status, authorId: row.authorId });

  const reasonLabel = new Map<string, string>(REPORT_REASONS.map((r) => [r.key, r.label]));

  const items = reports.map((report) => {
    const target = contentMap.get(`${report.targetType}:${report.targetId}`);
    return {
      id: report.id,
      targetType: report.targetType,
      targetTypeLabel: REPORT_TARGET_LABEL[report.targetType as ReportTargetType] ?? report.targetType,
      targetId: report.targetId,
      targetPreview: target?.preview ?? "",
      targetStatus: target?.status ?? "unknown",
      targetOwnerId: target?.authorId ?? report.targetOwnerId,
      reason: report.reason,
      reasonLabel: reasonLabel.get(report.reason) ?? report.reason,
      detail: report.detail,
      createdAt: report.createdAt,
      reporter: report.reporter,
    };
  });

  return NextResponse.json({ ok: true, items });
}
