import { prisma } from "./prisma";
import { recomputeUserStar } from "./star";
import { notify } from "./social";

/**
 * C 部分：举报、折叠与审核奖励
 * 规则（见蓝图 §8.12 / §14）：
 * - 同一用户对同一内容只能举报一次；
 * - 同一内容被 ≥3 次举报自动折叠并进入审核队列；
 * - 有效举报 +5（每日上限 5 个）；恶意/无效举报 -10；
 * - 被确认违规的内容作者 -20，内容隐藏。
 */

export const REPORT_REASONS = [
  { key: "ad", label: "广告/中介" },
  { key: "abuse", label: "人身攻击" },
  { key: "irrelevant", label: "无关内容" },
  { key: "privacy", label: "隐私泄露" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["key"];
export type ReportTargetType = "question" | "reply" | "review" | "ai_post" | "experience_post";

export const FOLD_THRESHOLD = 3;
export const DAILY_REPORT_LIMIT = 20;
export const DAILY_VALID_REWARD_LIMIT = 5;
export const VALID_REPORT_REWARD = 5;
export const FALSE_REPORT_PENALTY = -10;
export const VIOLATION_PENALTY = -20;

export const REPORT_TARGET_LABEL: Record<ReportTargetType, string> = {
  question: "提问",
  reply: "回复",
  review: "评价",
  ai_post: "AI 精选帖",
  experience_post: "经验帖/避雷帖",
};

interface TargetContent {
  ownerId: string;
  content?: string | null;
}

/** 根据 targetType 查找内容作者与内容预览。 */
export async function getTargetContent(
  targetType: ReportTargetType,
  targetId: string
): Promise<TargetContent | null> {
  switch (targetType) {
    case "question": {
      const row = await prisma.question.findUnique({
        where: { id: targetId },
        select: { authorId: true, title: true },
      });
      return row ? { ownerId: row.authorId, content: row.title } : null;
    }
    case "reply": {
      const row = await prisma.reply.findUnique({
        where: { id: targetId },
        select: { authorId: true, content: true },
      });
      return row ? { ownerId: row.authorId, content: row.content } : null;
    }
    case "review": {
      const row = await prisma.review.findUnique({
        where: { id: targetId },
        select: { authorId: true, content: true },
      });
      return row ? { ownerId: row.authorId, content: row.content } : null;
    }
    case "ai_post": {
      const row = await prisma.aiPost.findUnique({
        where: { id: targetId },
        select: { authorId: true, title: true },
      });
      return row ? { ownerId: row.authorId, content: row.title } : null;
    }
    case "experience_post": {
      const row = await prisma.experiencePost.findUnique({
        where: { id: targetId },
        select: { authorId: true, title: true },
      });
      return row ? { ownerId: row.authorId, content: row.title } : null;
    }
    default:
      return null;
  }
}

export async function updateTargetStatus(
  targetType: ReportTargetType,
  targetId: string,
  status: "visible" | "folded" | "hidden"
): Promise<void> {
  switch (targetType) {
    case "question":
      await prisma.question.update({ where: { id: targetId }, data: { status } });
      break;
    case "reply":
      await prisma.reply.update({ where: { id: targetId }, data: { status } });
      break;
    case "review":
      await prisma.review.update({ where: { id: targetId }, data: { status } });
      break;
    case "ai_post":
      await prisma.aiPost.update({ where: { id: targetId }, data: { status } });
      break;
    case "experience_post":
      await prisma.experiencePost.update({ where: { id: targetId }, data: { status } });
      break;
  }
}

/** 统计某内容当前 open 状态举报数；达到阈值则自动折叠。 */
export async function foldIfNeeded(targetType: ReportTargetType, targetId: string): Promise<boolean> {
  const count = await prisma.report.count({
    where: { targetType, targetId, status: "open" },
  });
  if (count >= FOLD_THRESHOLD) {
    await updateTargetStatus(targetType, targetId, "folded");
    return true;
  }
  return false;
}

export interface CreateReportInput {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  detail?: string;
}

/** 创建举报：校验、去重、每日上限，达阈值自动折叠。 */
export async function createReport(input: CreateReportInput): Promise<{ ok: boolean; error?: string; folded?: boolean }> {
  const { reporterId, targetType, targetId, reason, detail } = input;

  if (!REPORT_REASONS.some((r) => r.key === reason)) {
    return { ok: false, error: "举报原因不正确" };
  }

  const target = await getTargetContent(targetType, targetId);
  if (!target) return { ok: false, error: "举报的内容不存在" };
  if (target.ownerId === reporterId) return { ok: false, error: "不能举报自己的内容" };

  const existing = await prisma.report.findUnique({
    where: { reporterId_targetType_targetId: { reporterId, targetType, targetId } },
  });
  if (existing) return { ok: false, error: "你已经举报过这条内容了" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.report.count({
    where: { reporterId, createdAt: { gte: today } },
  });
  if (todayCount >= DAILY_REPORT_LIMIT) {
    return { ok: false, error: "今日举报次数已达上限" };
  }

  await prisma.report.create({
    data: {
      reporterId,
      targetType,
      targetId,
      targetOwnerId: target.ownerId,
      reason,
      detail: detail?.slice(0, 200) || null,
    },
  });

  const folded = await foldIfNeeded(targetType, targetId);
  return { ok: true, folded };
}

/**
 * 管理员结案：
 * - valid=true：举报有效，内容作者计违规 -20（每个内容只计一次），内容隐藏；举报者 +5（每日上限 5）。
 * - valid=false：举报无效，举报者 -10（恶意举报）。
 */
export async function resolveReport(
  reportId: string,
  valid: boolean
): Promise<{ ok: boolean; error?: string }> {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return { ok: false, error: "举报不存在" };
  if (report.status !== "open") return { ok: false, error: "该举报已处理" };

  if (valid) {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "resolved", isValid: true },
    });

    // 内容作者违规：该内容首次被确认为违规时计 -20，并隐藏内容
    const confirmedCount = await prisma.report.count({
      where: {
        targetType: report.targetType as ReportTargetType,
        targetId: report.targetId,
        status: "resolved",
        isValid: true,
      },
    });
    if (confirmedCount === 1 && report.targetOwnerId) {
      await updateTargetStatus(report.targetType as ReportTargetType, report.targetId, "hidden");
      await recomputeUserStar(report.targetOwnerId);
    }

    // 举报者奖励：每日上限 5 个有效举报
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rewardedToday = await prisma.report.count({
      where: {
        reporterId: report.reporterId,
        status: "resolved",
        isValid: true,
        rewardApplied: true,
        createdAt: { gte: today },
      },
    });
    if (rewardedToday < DAILY_VALID_REWARD_LIMIT) {
      await prisma.report.update({
        where: { id: reportId },
        data: { rewardApplied: true },
      });
      await recomputeUserStar(report.reporterId);
    } else {
      await prisma.report.update({ where: { id: reportId }, data: { rewardApplied: false } });
    }
    await notify(report.reporterId, "report_result", { type: "report_result", valid: true, targetType: report.targetType });
  } else {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "dismissed", isValid: false, rewardApplied: false },
    });
    await recomputeUserStar(report.reporterId);
    await notify(report.reporterId, "report_result", { type: "report_result", valid: false, targetType: report.targetType });
  }

  return { ok: true };
}

/** 用户被确认违规的内容数（去重，用于 -20 计分）。 */
export async function countViolations(userId: string): Promise<number> {
  const rows = await prisma.report.findMany({
    where: { targetOwnerId: userId, status: "resolved", isValid: true },
    select: { targetType: true, targetId: true },
  });
  return new Set(rows.map((row) => `${row.targetType}:${row.targetId}`)).size;
}

/** 用户获得奖励的有效举报数（rewardApplied=true）。 */
export async function countValidReportRewards(userId: string): Promise<number> {
  return prisma.report.count({
    where: { reporterId: userId, status: "resolved", isValid: true, rewardApplied: true },
  });
}

/** 用户恶意/无效举报数（-10）。 */
export async function countFalseReports(userId: string): Promise<number> {
  return prisma.report.count({
    where: { reporterId: userId, status: "dismissed", isValid: false },
  });
}
