import { levelForScore } from "@/lib/core";
import { prisma } from "./prisma";
import { safeParse } from "./format";
import { countFalseReports, countValidReportRewards, countViolations } from "./reports";

export type LikeTargetType = "question" | "reply" | "ai_post" | "experience_post";
export type FavoriteTargetType = "question" | "reply" | "ai_post" | "experience_post";

/**
 * Star 拆分为「点赞 + 收藏」两个信号（蓝图 v4.4）：
 * - 点赞（content_stars / starCount）：认可信号，计入 star_score 计分公式；
 * - 收藏（content_favorites / favoriteCount）：有用信号，仅参与推荐权重（见 recommend.ts favorite: 2.0）。
 */

export async function recomputeUserStar(userId: string): Promise<{ score: number; level: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { score: 0, level: 0 };

  const [questionRows, replyRows, postRows, expRows] = await Promise.all([
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
    prisma.experiencePost.findMany({
      where: { authorId: userId, status: { not: "hidden" } },
      select: { id: true },
    }),
  ]);

  const [questionStars, replyStars, postStars, expStars, accepted, validReports, falseReports, violations] =
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
      expRows.length
        ? prisma.contentStar.count({ where: { targetType: "experience_post", targetId: { in: expRows.map((p) => p.id) } } })
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
    expStars * 3 +
    accepted * 10 +
    verified * 20 +
    validReports * 5 +
    falseReports * -10 +
    violations * -20;
  const level = levelForScore(score);
  await prisma.user.update({ where: { id: userId }, data: { starScore: score, level } });
  return { score, level };
}

/** 点赞 toggle（原 star，语义改为点赞） */
export async function starTarget(userId: string, targetType: LikeTargetType, targetId: string) {
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
  if (targetType === "experience_post") {
    const p = await prisma.experiencePost.update({ where: { id: targetId }, data: { likeCount: { increment: 1 } } });
    return p.likeCount;
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
  if (targetType === "experience_post") {
    const p = await prisma.experiencePost.update({ where: { id: targetId }, data: { likeCount: { decrement: 1 } } });
    return Math.max(0, p.likeCount);
  }
  const p = await prisma.aiPost.update({ where: { id: targetId }, data: { starCount: { decrement: 1 } } });
  return Math.max(0, p.starCount);
}

/** 收藏 toggle（新信号，不计入 star_score，仅影响推荐） */
export async function favoriteTarget(userId: string, targetType: FavoriteTargetType, targetId: string) {
  const existing = await prisma.contentFavorite.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });
  if (existing) {
    await prisma.contentFavorite.delete({ where: { id: existing.id } });
    const count = await decrementFavoriteCount(targetType, targetId);
    return { active: false, count };
  }
  await prisma.contentFavorite.create({ data: { userId, targetType, targetId } });
  const count = await incrementFavoriteCount(targetType, targetId);
  return { active: true, count };
}

async function incrementFavoriteCount(targetType: string, targetId: string): Promise<number> {
  if (targetType === "question") {
    const q = await prisma.question.update({ where: { id: targetId }, data: { favoriteCount: { increment: 1 } } });
    return q.favoriteCount;
  }
  if (targetType === "reply") {
    const r = await prisma.reply.update({ where: { id: targetId }, data: { favoriteCount: { increment: 1 } } });
    return r.favoriteCount;
  }
  if (targetType === "experience_post") {
    const p = await prisma.experiencePost.update({ where: { id: targetId }, data: { favoriteCount: { increment: 1 } } });
    return p.favoriteCount;
  }
  const p = await prisma.aiPost.update({ where: { id: targetId }, data: { favoriteCount: { increment: 1 } } });
  return p.favoriteCount;
}

async function decrementFavoriteCount(targetType: string, targetId: string): Promise<number> {
  if (targetType === "question") {
    const q = await prisma.question.update({ where: { id: targetId }, data: { favoriteCount: { decrement: 1 } } });
    return Math.max(0, q.favoriteCount);
  }
  if (targetType === "reply") {
    const r = await prisma.reply.update({ where: { id: targetId }, data: { favoriteCount: { decrement: 1 } } });
    return Math.max(0, r.favoriteCount);
  }
  if (targetType === "experience_post") {
    const p = await prisma.experiencePost.update({ where: { id: targetId }, data: { favoriteCount: { decrement: 1 } } });
    return Math.max(0, p.favoriteCount);
  }
  const p = await prisma.aiPost.update({ where: { id: targetId }, data: { favoriteCount: { decrement: 1 } } });
  return Math.max(0, p.favoriteCount);
}

export function contentOwnerTarget(
  targetType: LikeTargetType | FavoriteTargetType,
  target: { authorId?: string } | { authorId?: string }
): string | null {
  return "authorId" in target && target.authorId ? target.authorId : null;
}