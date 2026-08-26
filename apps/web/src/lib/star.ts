import { levelForScore } from "@/lib/core";
import { prisma } from "./prisma";
import { safeParse } from "./format";
import { countFalseReports, countValidReportRewards, countViolations } from "./reports";

export async function recomputeUserStar(userId: string): Promise<{ score: number; level: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { score: 0, level: 0 };

  const [questionRows, replyRows, postRows] = await Promise.all([
    prisma.question.findMany({
      where: { authorId: userId, status: { not: "hidden" } },
      select: { id: true },
    }),
    prisma.reply.findMany({
      where: { authorId: userId, status: { not: "hidden" } },
      select: { id: true },
    }),
    prisma.aiPost.findMany({
      where: { authorId: userId, status: { notIn: ["hidden", "rejected"] } },
      select: { id: true },
    }),
  ]);

  const [questionStars, replyStars, postStars, accepted, validReports, falseReports, violations] =
    await Promise.all([
      questionRows.length
        ? prisma.contentStar.count({ where: { targetType: "question", targetId: { in: questionRows.map((q) => q.id) } } })
        : 0,
      replyRows.length
        ? prisma.contentStar.count({ where: { targetType: "reply", targetId: { in: replyRows.map((r) => r.id) } } })
        : 0,
      postRows.length
        ? prisma.contentStar.count({ where: { targetType: "ai_post", targetId: { in: postRows.map((p) => p.id) } } })
        : 0,
      prisma.reply.count({ where: { authorId: userId, isAccepted: true } }),
      countValidReportRewards(userId),
      countFalseReports(userId),
      countViolations(userId),
    ]);

  const verified = safeParse<string[]>(user.verifiedSchools, []).length;
  const score =
    questionStars * 1 +
    replyStars * 2 +
    postStars * 5 +
    accepted * 10 +
    verified * 20 +
    validReports * 5 +
    falseReports * -10 +
    violations * -20;
  const level = levelForScore(score);
  await prisma.user.update({ where: { id: userId }, data: { starScore: score, level } });
  return { score, level };
}

export async function starTarget(userId: string, targetType: "question" | "reply" | "ai_post", targetId: string) {
  const existing = await prisma.contentStar.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });
  if (existing) {
    await prisma.contentStar.delete({ where: { id: existing.id } });
    const count = await decrementCount(targetType, targetId);
    return { active: false, count };
  }
  await prisma.contentStar.create({ data: { userId, targetType, targetId } });
  const count = await incrementCount(targetType, targetId);
  return { active: true, count };
}

async function incrementCount(targetType: string, targetId: string): Promise<number> {
  if (targetType === "question") {
    const q = await prisma.question.update({ where: { id: targetId }, data: { starCount: { increment: 1 } } });
    return q.starCount;
  }
  if (targetType === "reply") {
    const r = await prisma.reply.update({ where: { id: targetId }, data: { starCount: { increment: 1 } } });
    return r.starCount;
  }
  const p = await prisma.aiPost.update({ where: { id: targetId }, data: { starCount: { increment: 1 } } });
  return p.starCount;
}

async function decrementCount(targetType: string, targetId: string): Promise<number> {
  if (targetType === "question") {
    const q = await prisma.question.update({ where: { id: targetId }, data: { starCount: { decrement: 1 } } });
    return Math.max(0, q.starCount);
  }
  if (targetType === "reply") {
    const r = await prisma.reply.update({ where: { id: targetId }, data: { starCount: { decrement: 1 } } });
    return Math.max(0, r.starCount);
  }
  const p = await prisma.aiPost.update({ where: { id: targetId }, data: { starCount: { decrement: 1 } } });
  return Math.max(0, p.starCount);
}

export function contentOwnerTarget(
  targetType: "question" | "reply" | "ai_post",
  target:
    | { authorId?: string }
    | { authorId?: string }
): string | null {
  return "authorId" in target && target.authorId ? target.authorId : null;
}
