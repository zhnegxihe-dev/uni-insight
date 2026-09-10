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
    { name: "province", label: "考生所在地", placeholder: "如：广东、湖南" },
    { name: "scoreBand", label: "分数/位次（可选）", placeholder: "如：600 分 / 省排 8000" },
    { name: "subjects", label: "选科（可选）", placeholder: "如：物理+化学+生物" },
    { name: "cityPref", label: "地区偏好（可选）", placeholder: "如：广东、长三角" },
  ],
  transfer: [
    { name: "university", label: "高校名称", placeholder: "如：中山大学" },
    { name: "fromMajor", label: "原专业", placeholder: "如：工商管理" },
    { name: "targetMajor", label: "目标专业", placeholder: "如：经济学" },
    { name: "grade", label: "年级", placeholder: "如：大一" },
  ],
  grad_cn: [
    { name: "undergradSchool", label: "本科院校名称", placeholder: "如：中山大学" },
    { name: "targetSchool", label: "目标院校名称", placeholder: "如：厦门大学" },
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

export const IDENTITY_ROLES = [
  { key: "gaokao", label: "高考生", scenario: "高考志愿" },
  { key: "transfer", label: "本科生（转专业）", scenario: "转专业" },
  { key: "grad_cn", label: "考研/保研", scenario: "考研保研" },
  { key: "grad_abroad", label: "申研/留学", scenario: "申研留学" },
  { key: "advisor", label: "选导师", scenario: "导师选择" },
  { key: "career", label: "就业/求职", scenario: "就业行业" },
] as const;

export type IdentityRole = (typeof IDENTITY_ROLES)[number]["key"];

export const SCENARIO_LABEL: Record<ConcreteScenario, string> = {
  gaokao: "高考志愿",
  transfer: "转专业",
  grad_cn: "考研保研",
  grad_abroad: "申研留学",
  advisor: "导师选择",
  career: "就业行业",
};

export const POST_TYPES = [
  { key: "experience", label: "经验帖", hint: "分享真实就读 / 申请 / 求职经验" },
  { key: "avoid", label: "避雷帖", hint: "提醒踩过的坑，帮后来人避雷" },
  { key: "promo", label: "推广帖", hint: "受商家委托的推荐，明示标注（独立推广池）" },
] as const;
export type ExperiencePostType = (typeof POST_TYPES)[number]["key"];

export const STAR_RULES = [
  { key: "question", label: "我发布的提问被点赞", weight: 1 },
  { key: "reply", label: "我发布的回复被点赞", weight: 2 },
  { key: "accepted", label: "回复被采纳", weight: 10 },
  { key: "aiPost", label: "AI 精选帖被点赞", weight: 5 },
  { key: "experiencePost", label: "我发布的经验帖/避雷帖被点赞", weight: 3 },
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

export type ReviewTarget = "school" | "major" | "course" | "teacher";

export const REVIEW_DIMENSIONS: Record<
  ReviewTarget,
  { key: string; label: string }[]
> = {
  school: [
    { key: "teaching", label: "教学" },
    { key: "workload", label: "课业量" },
    { key: "difficulty", label: "难度" },
    { key: "employment", label: "就业口碑" },
    { key: "atmosphere", label: "同学氛围" },
  ],
  major: [
    { key: "teaching", label: "教学" },
    { key: "workload", label: "课业量" },
    { key: "difficulty", label: "难度" },
    { key: "employment", label: "就业口碑" },
    { key: "atmosphere", label: "同学氛围" },
  ],
  course: [
    { key: "teaching", label: "教学质量" },
    { key: "workload", label: "课业量" },
    { key: "difficulty", label: "难度" },
    { key: "grading", label: "给分友好度" },
    { key: "career", label: "职业有用性" },
  ],
  teacher: [
    { key: "teaching", label: "教学清晰度" },
    { key: "patience", label: "答疑耐心" },
    { key: "grading", label: "给分" },
    { key: "guidance", label: "指导频率" },
    { key: "push", label: "push 程度" },
    { key: "atmosphere", label: "课题组氛围" },
    { key: "career", label: "毕业去向" },
    { key: "resources", label: "学术资源" },
  ],
};

export const OUTCOME_LABELS: Record<string, string> = {
  furtherStudy: "深造",
  employment: "就业",
  civilService: "考公",
};


// 商户分类与层级（v4.7 §8.17 商户与生活推荐体系）
export const MERCHANT_CATEGORIES = [
  { key: "campus_food", label: "校园餐饮", hint: "食堂窗口 / 校门口小店 / 夜宵摊" },
  { key: "city_food", label: "城市美食", hint: "餐厅 / 奶茶咖啡 / 连锁品牌" },
  { key: "scenic", label: "小众景区", hint: "山 / 海 / 公园 / 古镇 / 露营地" },
  { key: "leisure", label: "休闲去处", hint: "桌游 / 猫咖 / 书店自习 / 健身" },
  { key: "life_service", label: "生活服务", hint: "打印店 / 驾校 / 理发等" },
  { key: "edu_service", label: "学业服务", hint: "自习室 / 考研留学机构等" },
] as const;
export type MerchantCategory = (typeof MERCHANT_CATEGORIES)[number]["key"];

export const MERCHANT_TIERS = [
  { key: "street", label: "路边小店", hint: "个体小商贩 / 宝藏小店（免费认领）" },
  { key: "chain", label: "品牌馆", hint: "认证大商家 / 连锁品牌（付费入驻）" },
] as const;
export type MerchantTier = (typeof MERCHANT_TIERS)[number]["key"];

// 商户评价维度（v4.7 §8.17 Phase B：按品类定制，评分 1-5）
export const MERCHANT_REVIEW_DIMS: Record<string, { key: string; label: string }[]> = {
  campus_food: [
    { key: "taste", label: "口味" },
    { key: "env", label: "环境" },
    { key: "service", label: "服务" },
    { key: "value", label: "性价比" },
  ],
  city_food: [
    { key: "taste", label: "口味" },
    { key: "env", label: "环境" },
    { key: "service", label: "服务" },
    { key: "value", label: "性价比" },
  ],
  scenic: [
    { key: "view", label: "风景" },
    { key: "traffic", label: "交通便利" },
    { key: "crowd", label: "人流" },
    { key: "value", label: "性价比" },
  ],
  leisure: [
    { key: "experience", label: "体验" },
    { key: "env", label: "环境" },
    { key: "value", label: "性价比" },
    { key: "suit", label: "适合度" },
  ],
  life_service: [
    { key: "professional", label: "专业" },
    { key: "service", label: "服务" },
    { key: "value", label: "性价比" },
  ],
  edu_service: [
    { key: "professional", label: "专业性" },
    { key: "transparency", label: "信息透明度" },
    { key: "service", label: "服务态度" },
    { key: "value", label: "性价比" },
    { key: "result", label: "结果真实性" },
  ],
};

// 评价数不足该值时不展示星级（防小样本误导）
export const MERCHANT_MIN_REVIEWS = 5;

// 评价防刷：账号注册满该天数，其评价才计入评分（v4.7 Phase C）
export const MERCHANT_MIN_ACCOUNT_AGE_DAYS = 3;
