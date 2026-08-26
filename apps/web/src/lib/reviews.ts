import { OUTCOME_LABELS, REVIEW_DIMENSIONS, type ReviewTarget } from "@/lib/core";

export interface ReviewLike {
  ratings: string;
  content?: string | null;
  isAlumni?: boolean;
  author?: { nickname: string; verifiedSchools: string } | null;
}

export interface Outcomes {
  furtherStudy: number;
  employment: number;
  civilService: number;
}

export const RATING_KEYS_BY_TARGET: Record<ReviewTarget, string[]> = {
  school: ["teaching", "workload", "difficulty", "employment", "atmosphere"],
  major: ["teaching", "workload", "difficulty", "employment", "atmosphere"],
  course: ["teaching", "workload", "difficulty", "grading", "career"],
  teacher: ["teaching", "patience", "grading", "guidance", "push", "atmosphere", "career", "resources"],
};

export function parseRatings(ratingsJson: string): Record<string, number> {
  try {
    const raw = JSON.parse(ratingsJson) as Record<string, unknown>;
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "number" && Number.isFinite(value)) result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

export function averageRatings(
  reviews: ReviewLike[],
  dims: { key: string; label: string }[]
): { key: string; label: string; avg: number | null; count: number }[] {
  return dims.map((dim) => {
    const values = reviews
      .map((review) => parseRatings(review.ratings)[dim.key])
      .filter((value): value is number => typeof value === "number");
    const avg = values.length
      ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
      : null;
    return { key: dim.key, label: dim.label, avg, count: values.length };
  });
}

export function ratingDistribution(reviews: ReviewLike[], key: string): number[] {
  const distribution = [0, 0, 0, 0, 0];
  for (const review of reviews) {
    const value = parseRatings(review.ratings)[key];
    if (typeof value === "number" && value >= 1 && value <= 5) {
      distribution[Math.round(value) - 1] += 1;
    }
  }
  return distribution;
}

function parseOutcomes(ratingsJson: string): Outcomes | null {
  try {
    const raw = JSON.parse(ratingsJson) as { outcomes?: Partial<Outcomes> };
    const outcomes = raw.outcomes;
    if (!outcomes) return null;
    return {
      furtherStudy: Number(outcomes.furtherStudy ?? 0),
      employment: Number(outcomes.employment ?? 0),
      civilService: Number(outcomes.civilService ?? 0),
    };
  } catch {
    return null;
  }
}

export function aggregateOutcomes(reviews: ReviewLike[]): Outcomes | null {
  const rows = reviews
    .map((review) => parseOutcomes(review.ratings))
    .filter((row): row is Outcomes => row !== null);
  if (rows.length === 0) return null;
  const keys = Object.keys(OUTCOME_LABELS) as (keyof Outcomes)[];
  const result = {} as Outcomes;
  for (const key of keys) {
    result[key] = Math.round(rows.reduce((sum, row) => sum + row[key], 0) / rows.length);
  }
  return result;
}

function ratingScore(review: ReviewLike): number {
  const values = Object.values(parseRatings(review.ratings));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function buildReviewSummary(
  reviews: ReviewLike[],
  label: string,
  dims: { key: string; label: string }[]
): { overview: string; strengths: string[]; weaknesses: string[]; note: string } | null {
  if (reviews.length === 0) return null;
  const averages = averageRatings(reviews, dims);
  const rated = averages.filter((item) => item.avg !== null);
  const overall =
    rated.length > 0
      ? Math.round((rated.reduce((sum, item) => sum + (item.avg ?? 0), 0) / rated.length) * 10) / 10
      : 0;
  const top = [...reviews].sort((a, b) => ratingScore(b) - ratingScore(a))[0]?.content;
  const verifiedCount = reviews.filter(
    (review) => review.author && (review.author.verifiedSchools || "").length > 2
  ).length;

  const strengths = rated
    .filter((item) => item.avg !== null && item.avg >= 4)
    .map((item) => `${item.label}评分较高（${item.avg}）`);
  const weaknesses = rated
    .filter((item) => item.avg !== null && item.avg <= 3)
    .map((item) => `${item.label}评分偏低（${item.avg}）`);

  return {
    overview: `${label}共收到 ${reviews.length} 条结构化评价，综合均分 ${overall}/5。${
      top ? top.slice(0, 60) + (top.length > 60 ? "…" : "") : ""
    }`,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    note: `基于 ${reviews.length} 条评价聚合，其中 ${verifiedCount} 条来自认证用户；仅整理学生观点，不构成官方信息。`,
  };
}

export function reviewTargetOf(input: {
  courseId?: string | null;
  teacherId?: string | null;
  majorId?: string | null;
}): ReviewTarget {
  if (input.courseId) return "course";
  if (input.teacherId) return "teacher";
  if (input.majorId) return "major";
  return "school";
}

export function dimensionsFor(target: ReviewTarget) {
  return REVIEW_DIMENSIONS[target];
}
