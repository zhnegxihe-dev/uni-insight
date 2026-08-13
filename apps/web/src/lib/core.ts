export const SCENARIOS = [
  { type: "all", label: "全部" },
  { type: "gaokao", label: "高考志愿" },
  { type: "transfer", label: "转专业" },
  { type: "grad_cn", label: "考研保研" },
  { type: "grad_abroad", label: "申研留学" },
  { type: "advisor", label: "导师选择" },
  { type: "career", label: "就业行业" },
] as const;

export type ScenarioType = (typeof SCENARIOS)[number]["type"];
export type ConcreteScenario = Exclude<ScenarioType, "all">;

export const SCENARIO_FIELDS: Record<
  ConcreteScenario,
  { name: string; label: string; placeholder: string }[]
> = {
  gaokao: [
    { name: "scoreBand", label: "分数/位次（可选）", placeholder: "如：600 分 / 省排 8000" },
    { name: "subjects", label: "选科（可选）", placeholder: "如：物理+化学+生物" },
    { name: "cityPref", label: "地区偏好（可选）", placeholder: "如：广东、长三角" },
  ],
  transfer: [
    { name: "fromMajor", label: "原专业", placeholder: "如：工商管理" },
    { name: "targetMajor", label: "目标专业", placeholder: "如：经济学" },
    { name: "grade", label: "年级", placeholder: "如：大一" },
  ],
  grad_cn: [
    { name: "undergradLevel", label: "本科院校层次（可选）", placeholder: "如：211、双非" },
    { name: "track", label: "方向", placeholder: "学硕 / 专硕 / 保研 / 统考" },
  ],
  grad_abroad: [
    { name: "country", label: "目标国家/地区", placeholder: "如：英国、香港、美国" },
    { name: "targetSchool", label: "目标院校（可选）", placeholder: "如：LSE、港中文" },
    { name: "direction", label: "专业方向（可选）", placeholder: "如：经济学、金融" },
  ],
  advisor: [
    { name: "teacherName", label: "导师姓名", placeholder: "如：王教授" },
    { name: "direction", label: "研究方向（可选）", placeholder: "如：产业经济学" },
    { name: "goal", label: "深造/就业意向", placeholder: "如：读博 / 就业" },
  ],
  career: [
    { name: "major", label: "专业", placeholder: "如：经济学" },
    { name: "city", label: "城市（可选）", placeholder: "如：广州、深圳" },
    { name: "industry", label: "行业/岗位（可选）", placeholder: "如：金融、互联网、考公" },
  ],
};

export const SCENARIO_LABEL: Record<ConcreteScenario, string> = {
  gaokao: "高考志愿",
  transfer: "转专业",
  grad_cn: "考研保研",
  grad_abroad: "申研留学",
  advisor: "导师选择",
  career: "就业行业",
};

export const STAR_RULES = [
  { key: "question", label: "我发布的提问被 star", weight: 1 },
  { key: "reply", label: "我发布的回复被 star", weight: 2 },
  { key: "accepted", label: "回复被采纳", weight: 10 },
  { key: "aiPost", label: "AI 精选帖被 star", weight: 5 },
  { key: "validReport", label: "有效举报中介/广告", weight: 5 },
  { key: "verifiedSchool", label: "学校邮箱认证", weight: 20 },
  { key: "falseReport", label: "恶意/无效举报", weight: -10 },
  { key: "violation", label: "被确认违规", weight: -20 },
] as const;

export const LEVELS = [
  { level: 0, min: 0, name: "L0 新用户", reward: "每日回复 5 条，不能发布 AI 精选帖" },
  { level: 1, min: 30, name: "L1 初出茅庐", reward: "每日回复 20 条、可收藏关注、基础徽章" },
  { level: 2, min: 100, name: "L2 内容创作者", reward: "解锁 AI 精选帖发布、标签创建申请、个人主页精选位" },
  { level: 3, min: 300, name: "L3 社区共建者", reward: "可编辑学校/专业档案、进入志愿者审核队列、AI 引用更高权重" },
  { level: 4, min: 800, name: "L4 优质回答者", reward: "wiki 共建、首页推荐加权、年度社区奖提名" },
] as const;

export function levelForScore(score: number): number {
  if (score >= 800) return 4;
  if (score >= 300) return 3;
  if (score >= 100) return 2;
  if (score >= 30) return 1;
  return 0;
}
