import { prisma } from "./prisma";
import { safeParse } from "./format";
import { IDENTITY_ROLES, SCENARIO_LABEL, type IdentityRole } from "./core";

/**
 * D 部分：个性化内容推荐（蓝图 v4.1 §8.11）
 * 身份种子 + 搜索引导 + 行为画像(user_actions → user_profiles 标签向量) + 余弦相似度。
 * 数据量小时实时计算，Phase 3 再上 ML/向量库。
 */

export interface IdentityInput {
  role?: string;
  targetSchool?: string;
  targetMajor?: string;
  region?: string;
}

export type ActionType = "view" | "search" | "star" | "reply" | "post" | "verify";

const SEED_WEIGHTS: Record<string, number> = { scenario: 1.2, school: 1.5, major: 1.5, region: 0.8 };
const ACTION_WEIGHTS: Record<ActionType, number> = {
  view: 0.3,
  search: 0.5,
  star: 1.0,
  reply: 1.5,
  post: 1.5,
  verify: 1.0,
};
const HALF_LIFE_DAYS = 60;
const REGIONS = ["广东", "北京", "上海", "江苏", "浙江", "湖北", "四川", "福建", "陕西", "天津", "山东", "湖南", "重庆", "辽宁"];

/** 时间衰减：weight = base × 0.5^(age_days/60) */
function decayWeight(base: number, createdAt: Date): number {
  const days = (Date.now() - createdAt.getTime()) / 86_400_000;
  return base * Math.pow(0.5, Math.max(0, days) / HALF_LIFE_DAYS);
}

/** 注册身份 → 种子标签向量 */
export function identitySeedVector(identity: IdentityInput): Record<string, number> {
  const vector: Record<string, number> = {};
  if (identity.role && IDENTITY_ROLES.some((r) => r.key === identity.role)) {
    vector[`scenario:${identity.role}`] = SEED_WEIGHTS.scenario;
  }
  if (identity.targetSchool) vector[`school:${identity.targetSchool}`] = SEED_WEIGHTS.school;
  if (identity.targetMajor) vector[`major:${identity.targetMajor}`] = SEED_WEIGHTS.major;
  if (identity.region) vector[`region:${identity.region}`] = SEED_WEIGHTS.region;
  return vector;
}

/** 问题 → 内容标签（与用户向量同空间） */
export function tagsOfQuestion(question: {
  scenarioType: string;
  tags?: { tag: { name: string; type: string } }[];
}): string[] {
  const tags: string[] = [`scenario:${question.scenarioType}`];
  for (const item of question.tags ?? []) {
    const t = item.tag;
    if (t.type === "school") tags.push(`school:${t.name}`);
    else if (t.type === "major") tags.push(`major:${t.name}`);
    else if (t.type === "region") tags.push(`region:${t.name}`);
    else tags.push(`kw:${t.name}`);
  }
  return Array.from(new Set(tags));
}

/** 内容向量（等权重，命中次数累加） */
export function questionVector(tags: string[]): Record<string, number> {
  const vector: Record<string, number> = {};
  for (const tag of tags) vector[tag] = (vector[tag] ?? 0) + 1;
  return vector;
}

/** 余弦相似度 */
export function cosine(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k in a) {
    na += a[k] * a[k];
    if (b[k]) dot += a[k] * b[k];
  }
  for (const k in b) nb += b[k] * b[k];
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** 热度分：score = (star×3 + reply×2) / (age_hours + 2)^1.5 */
export function hotScore(question: { starCount: number; replyCount: number; createdAt: Date }): number {
  const ageHours = Math.max(0.1, (Date.now() - question.createdAt.getTime()) / 3_600_000);
  return (question.starCount * 3 + question.replyCount * 2) / Math.pow(ageHours + 2, 1.5);
}

export interface RecordActionInput {
  actionType: ActionType;
  targetType?: string;
  targetId?: string;
  tags?: string[];
}

/** 记录行为并增量更新用户向量 */
export async function recordAction(userId: string, input: RecordActionInput): Promise<void> {
  const tags = Array.from(new Set(input.tags ?? []));
  await prisma.userAction.create({
    data: {
      userId,
      actionType: input.actionType,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      tags: JSON.stringify(tags),
    },
  });
  const weight = ACTION_WEIGHTS[input.actionType] ?? 0.5;
  if (weight <= 0) return;
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const vector = profile ? safeParse<Record<string, number>>(profile.tagVector, {}) : {};
  for (const tag of tags) vector[tag] = (vector[tag] ?? 0) + weight;
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, tagVector: JSON.stringify(vector) },
    update: { tagVector: JSON.stringify(vector) },
  });
}

/** 全量重建画像：身份种子 + 认证学校 + 全部行为（带衰减） */
export async function rebuildUserProfile(userId: string): Promise<Record<string, number>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { identity: true, verifiedSchools: true },
  });
  const vector = identitySeedVector(safeParse<IdentityInput>(user?.identity ?? "{}", {}));
  for (const school of safeParse<string[]>(user?.verifiedSchools ?? "[]", [])) {
    vector[`school:${school}`] = (vector[`school:${school}`] ?? 0) + ACTION_WEIGHTS.verify;
  }
  const actions = await prisma.userAction.findMany({
    where: { userId },
    select: { actionType: true, tags: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  for (const action of actions) {
    const tags = safeParse<string[]>(action.tags, []);
    const weight = decayWeight(ACTION_WEIGHTS[action.actionType as ActionType] ?? 0.5, action.createdAt);
    for (const tag of tags) vector[tag] = (vector[tag] ?? 0) + weight;
  }
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, tagVector: JSON.stringify(vector) },
    update: { tagVector: JSON.stringify(vector) },
  });
  return vector;
}

/** 获取用户当前向量（优先缓存画像，无则用身份种子） */
export async function getUserVector(userId: string): Promise<Record<string, number>> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (profile) return safeParse<Record<string, number>>(profile.tagVector, {});
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { identity: true } });
  return identitySeedVector(safeParse<IdentityInput>(user?.identity ?? "{}", {}));
}

/** 标签 → 推荐理由文案 */
export function tagLabel(tag: string): string {
  const [prefix, name] = tag.split(":");
  if (prefix === "scenario") return `你是${SCENARIO_LABEL[name as keyof typeof SCENARIO_LABEL] ?? name}用户`;
  if (prefix === "school") return `你关注${name}`;
  if (prefix === "major") return `你关注${name}`;
  if (prefix === "region") return `你在${name}`;
  return `你对${name}感兴趣`;
}

const QUESTION_INCLUDE = {
  author: { select: { nickname: true, verifiedSchools: true, level: true } },
  tags: { include: { tag: { select: { id: true, name: true, type: true, slug: true } } } },
  aiSummary: { select: { id: true, confidence: true } },
} as const;

/** 为你推荐：相似度 + 热度加权 */
export async function getRecommendations(userId: string, limit = 6) {
  const userVector = await getUserVector(userId);
  const hasProfile = Object.keys(userVector).length > 0;

  const questions = await prisma.question.findMany({
    where: { status: { not: "hidden" } },
    include: QUESTION_INCLUDE,
    take: 60,
  });

  const scored = questions
    .map((question) => {
      const tags = tagsOfQuestion(question);
      const sim = cosine(userVector, questionVector(tags));
      const hot = hotScore(question);
      return { question, tags, sim, hot, score: sim + hot * 0.3 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const topTags = Object.entries(userVector)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([tag]) => tagLabel(tag));
  const reason = topTags.length ? `因为${topTags.join("、")}` : null;

  return { items: scored, hasProfile, reason, userVector };
}

/** 热门榜（冷启动兜底，未登录也可见） */
export async function getHotQuestions(limit = 6) {
  const questions = await prisma.question.findMany({
    where: { status: { not: "hidden" } },
    include: QUESTION_INCLUDE,
    take: 60,
  });
  return questions
    .map((question) => ({ question, hot: hotScore(question) }))
    .sort((a, b) => b.hot - a.hot)
    .slice(0, limit);
}

/** 解析搜索词 → 推荐标签（学校/专业/场景/地区实体优先，未命中降级为关键词） */
export async function parseSearchQuery(query: string): Promise<string[]> {
  const trimmed = (query ?? "").trim();
  if (!trimmed) return [];
  const tags: string[] = [];

  const [schools, majors] = await Promise.all([
    prisma.school.findMany({ select: { name: true }, take: 10 }),
    prisma.major.findMany({ select: { name: true }, take: 10 }),
  ]);
  for (const school of schools) {
    if (trimmed.includes(school.name) || school.name.includes(trimmed)) tags.push(`school:${school.name}`);
  }
  for (const major of majors) {
    if (trimmed.includes(major.name) || major.name.includes(trimmed)) tags.push(`major:${major.name}`);
  }

  const scenarioRules: [RegExp, string][] = [
    [/高考|志愿|分数|位次|选科/, "gaokao"],
    [/转专业/, "transfer"],
    [/考研|保研|研究生|学硕|专硕/, "grad_cn"],
    [/留学|申研|出国|雅思|托福|港校|英澳美/, "grad_abroad"],
    [/导师|课题组|科研方向|选导师/, "advisor"],
    [/就业|求职|实习|行业|工作|校招|考公/, "career"],
  ];
  for (const [re, key] of scenarioRules) {
    if (re.test(trimmed)) tags.push(`scenario:${key}`);
  }
  for (const region of REGIONS) {
    if (trimmed.includes(region)) tags.push(`region:${region}`);
  }

  if (tags.length === 0) tags.push(`kw:${trimmed.slice(0, 20)}`);
  return Array.from(new Set(tags));
}
