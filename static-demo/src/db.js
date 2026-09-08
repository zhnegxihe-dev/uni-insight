import seed from "./data/seed.json";

const KEY = "uni_static_demo_v1";

export const SCENARIOS = [
  { type: "all", label: "全部" },
  { type: "gaokao", label: "高考志愿" },
  { type: "transfer", label: "转专业" },
  { type: "grad_cn", label: "考研保研" },
  { type: "grad_abroad", label: "申研留学" },
  { type: "advisor", label: "导师选择" },
  { type: "career", label: "就业行业" },
];

export const POST_TYPES = [
  { key: "experience", label: "经验帖", hint: "分享真实就读 / 申请 / 求职经验" },
  { key: "avoid", label: "避雷帖", hint: "提醒踩过的坑，帮后来人避雷" },
  { key: "promo", label: "推广帖", hint: "受商家委托的推荐，明示标注（独立推广池）" },
];

export const MERCHANT_CATEGORIES = [
  { key: "campus_food", label: "校园餐饮", hint: "食堂窗口 / 校门口小店 / 夜宵摊" },
  { key: "city_food", label: "城市美食", hint: "餐厅 / 奶茶咖啡 / 连锁品牌" },
  { key: "scenic", label: "小众景区", hint: "山 / 海 / 公园 / 古镇 / 露营地" },
  { key: "leisure", label: "休闲去处", hint: "桌游 / 猫咖 / 书店自习 / 健身" },
  { key: "life_service", label: "生活服务", hint: "打印店 / 驾校 / 理发等" },
  { key: "edu_service", label: "学业服务", hint: "自习室 / 考研留学机构等" },
];

export const MERCHANT_TIERS = [
  { key: "street", label: "路边小店", hint: "个体小商贩 / 宝藏小店（免费认领）" },
  { key: "chain", label: "品牌馆", hint: "认证大商家 / 连锁品牌（付费入驻）" },
];


export const SCENARIO_LABEL = {
  gaokao: "高考志愿",
  transfer: "转专业",
  grad_cn: "考研保研",
  grad_abroad: "申研留学",
  advisor: "导师选择",
  career: "就业行业",
};

export const SCENARIO_FIELDS = {
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

export const LEVELS = [
  { level: 0, min: 0, name: "L0 新用户", reward: "每日回复 5 条，不能发布 AI 精选帖" },
  { level: 1, min: 30, name: "L1 初出茅庐", reward: "每日回复 20 条、可收藏关注、基础徽章" },
  { level: 2, min: 100, name: "L2 内容创作者", reward: "解锁 AI 精选帖发布、个人主页精选位" },
  { level: 3, min: 300, name: "L3 社区共建者", reward: "可编辑学校/专业档案、志愿者审核队列" },
  { level: 4, min: 800, name: "L4 优质回答者", reward: "wiki 共建、首页推荐加权、年度社区奖" },
];

export function levelForScore(score) {
  if (score >= 800) return 4;
  if (score >= 300) return 3;
  if (score >= 100) return 2;
  if (score >= 30) return 1;
  return 0;
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function initState() {
  return {
    version: 1,
    users: seed.users.map((u) => ({ ...u })),
    schools: seed.schools.map((s) => ({ ...s })),
    majors: seed.majors.map((m) => ({ ...m })),
    courses: seed.courses.map((c) => ({ ...c })),
    teachers: seed.teachers.map((t) => ({ ...t })),
    tags: seed.tags.map((t) => ({ ...t })),
    questions: seed.questions.map((q) => ({ ...q })),
    replies: seed.replies.map((r) => ({ ...r })),
    questionTags: seed.questionTags.map((t) => ({ ...t })),
    reviews: seed.reviews.map((r) => ({ ...r })),
    aiSummaries: seed.aiSummaries.map((a) => ({ ...a })),
    aiPosts: seed.aiPosts.map((p) => ({ ...p })),
    experiencePosts: seed.experiencePosts ? seed.experiencePosts.map((p) => ({ ...p })) : [],
    merchants: seed.merchants ? seed.merchants.map((m) => ({ ...m })) : [],
    myStars: [],
    myFavorites: [],
    follows: [],
    conversations: [],
    notifications: [],
    reports: [],
    currentUserId: null,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) {
        // v4.4 迁移：补充经验帖/收藏相关字段（保留用户已有数据）
        if (!Array.isArray(parsed.experiencePosts)) {
          parsed.experiencePosts = seed.experiencePosts ? seed.experiencePosts.map((p) => ({ ...p })) : [];
        }
        if (!Array.isArray(parsed.myFavorites)) parsed.myFavorites = [];
        if (!Array.isArray(parsed.merchants)) parsed.merchants = seed.merchants ? seed.merchants.map((m) => ({ ...m })) : [];
        for (const u of parsed.users) if (typeof u.trustScore !== "number") u.trustScore = 0;
        for (const x of parsed.experiencePosts) if (!("merchantName" in x)) x.merchantName = null;
        for (const q of parsed.questions) if (typeof q.favoriteCount !== "number") q.favoriteCount = 0;
        for (const r of parsed.replies) if (typeof r.favoriteCount !== "number") r.favoriteCount = 0;
        for (const p of parsed.aiPosts) if (typeof p.favoriteCount !== "number") p.favoriteCount = 0;
        for (const r of parsed.replies) {
          if (!("parentReplyId" in r)) r.parentReplyId = null;
        }
        for (const q of parsed.questions) {
          if (!("forkedFromQuestionId" in q)) q.forkedFromQuestionId = null;
          if (!("forkedFromReplyIds" in q)) q.forkedFromReplyIds = "[]";
        }
        for (const x of parsed.experiencePosts) {
          if (!("sourceReplyId" in x)) x.sourceReplyId = null;
          if (!("sourceQuestionId" in x)) x.sourceQuestionId = null;
          if (!("merchantId" in x)) x.merchantId = null;
        }

        saveState(parsed);
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const fresh = initState();
  saveState(fresh);
  return fresh;
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  const fresh = initState();
  saveState(fresh);
  return fresh;
}

/* ---------- 用户 ---------- */
export function getCurrentUser(state) {
  return state.users.find((u) => u.id === state.currentUserId) ?? null;
}

export function loginAs(state, userId) {
  state.currentUserId = userId;
  saveState(state);
}

export function registerUser(state, { nickname, email, password }) {
  if (!nickname || !email || !password) throw new Error("请填写完整信息");
  if (state.users.some((u) => u.email === email)) throw new Error("该邮箱已注册");
  const user = {
    id: uid("u"),
    nickname,
    email,
    password,
    bio: "",
    verifiedSchools: "[]",
    level: 0,
    starScore: 0,
    trustScore: 0,
    createdAt: new Date().toISOString(),
  };
  state.users.push(user);
  state.currentUserId = user.id;
  saveState(state);
  return user;
}

export function logout(state) {
  state.currentUserId = null;
  saveState(state);
}

/* ---------- 内容 ---------- */
export function hotScore(q) {
  const ageHours = Math.max(0.1, (Date.now() - new Date(q.createdAt).getTime()) / 3600000);
  return (q.starCount * 3 + q.replyCount * 2) / Math.pow(ageHours + 2, 1.5);
}

export function hotScorePost(post) {
  const ageHours = Math.max(0.1, (Date.now() - new Date(post.createdAt).getTime()) / 3600000);
  return (post.likeCount * 3 + post.favoriteCount * 4) / Math.pow(ageHours + 2, 1.5);
}

export function getQuestions(state, { scenario = "all", q = "" } = {}) {
  let list = state.questions.filter((x) => x.status !== "hidden");
  if (scenario !== "all") list = list.filter((x) => x.scenarioType === scenario);
  if (q) {
    const kw = q.toLowerCase();
    list = list.filter(
      (x) => x.title.toLowerCase().includes(kw) || (x.description || "").toLowerCase().includes(kw)
    );
  }
  return [...list].sort((a, b) => hotScore(b) - hotScore(a));
}

export function getQuestion(state, id) {
  const question = state.questions.find((x) => x.id === id);
  if (!question) return null;
  const author = state.users.find((u) => u.id === question.authorId);
  const tags = state.questionTags
    .filter((qt) => qt.questionId === id)
    .map((qt) => state.tags.find((t) => t.id === qt.tagId))
    .filter(Boolean);
  const replies = state.replies
    .filter((r) => r.questionId === id && r.status !== "hidden")
    .sort((a, b) => b.starCount - a.starCount || new Date(a.createdAt) - new Date(b.createdAt));
  return { ...question, author, tags, replies: replies.map((r) => ({ ...r, author: state.users.find((u) => u.id === r.authorId) })) };
}

export function createQuestion(state, { title, description, scenarioType, scenarioMeta, degreeLevel, tagNames }) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  const question = {
    id: uid("q"),
    title,
    description: description || null,
    authorId: user.id,
    scenarioType,
    scenarioMeta: JSON.stringify(scenarioMeta || {}),
    degreeLevel: degreeLevel || "bachelor",
    replyCount: 0,
    starCount: 0,
    acceptedReplyId: null,
    status: "visible",
    createdAt: new Date().toISOString(),
  };
  state.questions.push(question);
  for (const name of (tagNames || []).slice(0, 5)) {
    let tag = state.tags.find((t) => t.name === name);
    if (!tag) {
      tag = { id: uid("t"), name, slug: `t-${name}`, type: "custom" };
      state.tags.push(tag);
    }
    state.questionTags.push({ questionId: question.id, tagId: tag.id });
  }
  saveState(state);
  return question;
}

export function createQuestionFork(state, { title, description, originQuestionId, forkedFromReplyIds }) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  if (!title) throw new Error("请填写标题");
  const origin = state.questions.find((q) => q.id === originQuestionId);
  if (!origin || origin.status === "hidden") throw new Error("来源问题不存在或已被隐藏");
  const ids = (forkedFromReplyIds || []).slice(0, 5);
  const replies = state.replies.filter((r) => ids.includes(r.id) && r.questionId === originQuestionId && r.status !== "hidden");
  if (replies.length !== ids.length) throw new Error("引用的回复不存在或已被隐藏");
  const canFork = origin.authorId === user.id || replies.some((r) => r.authorId === user.id);
  if (!canFork) throw new Error("只能转自己参与讨论的回复为帖子");
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todayCount = state.questions.filter(
    (q) => q.authorId === user.id && q.forkedFromQuestionId && new Date(q.createdAt) >= dayStart
  ).length;
  if (todayCount >= 5) throw new Error("今日转帖已达上限（5 次），明天再来吧");
  const nameOf = (authorId) => (authorId === user.id ? "我" : (state.users.find((u) => u.id === authorId)?.nickname ?? "对方"));
  const quoted = replies
    .map((r) => `· @${nameOf(r.authorId)}：${r.content.length > 90 ? r.content.slice(0, 90) + "…" : r.content}`)
    .join("\n");
  const snapshot = `转自《${origin.title}》的讨论（引用快照，不可编辑）：\n${quoted}`;
  const finalDescription = ((description ? description + "\n\n" : "") + snapshot).slice(0, 300);
  const question = {
    id: uid("q"),
    title,
    description: finalDescription,
    authorId: user.id,
    scenarioType: origin.scenarioType,
    scenarioMeta: origin.scenarioMeta,
    degreeLevel: origin.degreeLevel || "bachelor",
    replyCount: 0,
    starCount: 0,
    favoriteCount: 0,
    acceptedReplyId: null,
    forkedFromQuestionId: origin.id,
    forkedFromReplyIds: JSON.stringify(replies.map((r) => r.id)),
    status: "visible",
    createdAt: new Date().toISOString(),
  };
  state.questions.push(question);
  const originQTs = state.questionTags.filter((qt) => qt.questionId === origin.id);
  for (const qt of originQTs) state.questionTags.push({ questionId: question.id, tagId: qt.tagId });
  for (const r of replies) {
    if (r.authorId !== user.id) {
      const author = state.users.find((u) => u.id === r.authorId);
      notify(state, r.authorId, "reply", { type: "fork", actorId: user.id, actorName: user.nickname, questionId: question.id, questionTitle: title, originQuestionTitle: origin.title });
    }
  }
  saveState(state);
  return question;
}

export function getRelatedDerived(state, questionId) {
  const forkedQuestions = state.questions
    .filter((q) => q.forkedFromQuestionId === questionId && q.status !== "hidden")
    .map((q) => ({ ...q, author: state.users.find((u) => u.id === q.authorId) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const derivedPosts = state.experiencePosts
    .filter((p) => p.sourceQuestionId === questionId && p.status !== "hidden" && p.postType !== "promo")
    .map((p) => ({ ...p, author: state.users.find((u) => u.id === p.authorId) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { forkedQuestions, derivedPosts };
}

export function postSource(state, post) {
  if (!post.sourceReplyId || !post.sourceQuestionId) return null;
  const reply = state.replies.find((r) => r.id === post.sourceReplyId) ?? null;
  const question = state.questions.find((q) => q.id === post.sourceQuestionId) ?? null;
  if (!reply || !question) return null;
  const replyAuthor = state.users.find((u) => u.id === reply.authorId);
  const degraded = reply.status !== "visible" || question.status !== "visible";
  return {
    reply,
    question,
    replyAuthorName: replyAuthor?.nickname ?? "对方",
    replyAuthorId: reply.authorId,
    replySnippet: reply.content.length > 60 ? reply.content.slice(0, 60) + "…" : reply.content,
    isQuote: reply.authorId !== post.authorId,
    degraded,
  };
}

export function createReply(state, questionId, content, opts = {}) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  if (!content) throw new Error("回复内容不能为空");
  if (content.length > 280) throw new Error("回复最多 280 字");
  const question = state.questions.find((x) => x.id === questionId);
  if (!question) throw new Error("问题不存在");
  const parentReplyId = opts.parentReplyId || null;
  let parentReply = null;
  if (parentReplyId) {
    parentReply = state.replies.find((r) => r.id === parentReplyId) ?? null;
    if (!parentReply) throw new Error("要回复的回复不存在");
    if (parentReply.questionId !== questionId) throw new Error("只能回复同一问题下的回复");
    if (parentReply.status === "hidden") throw new Error("该回复已被隐藏，无法追问");
    if (parentReply.parentReplyId) throw new Error("追问只支持一层，请回到原回复下继续");
  }
  const reply = {
    id: uid("r"),
    questionId,
    authorId: user.id,
    content,
    parentReplyId,
    starCount: 0,
    favoriteCount: 0,
    isAccepted: false,
    status: "visible",
    createdAt: new Date().toISOString(),
  };
  state.replies.push(reply);
  question.replyCount += 1;
  if (parentReply && parentReply.authorId !== user.id && parentReply.authorId !== question.authorId) {
    notify(state, parentReply.authorId, "reply", { type: "reply", actorId: user.id, actorName: user.nickname, questionId, questionTitle: question.title, replyId: reply.id, parentReply: true });
  }
  if (question.authorId !== user.id) {
    notify(state, question.authorId, "reply", { type: "reply", actorId: user.id, actorName: user.nickname, questionId, questionTitle: question.title, replyId: reply.id });
  }
  saveState(state);
  return reply;
}
/* ---------- 经验帖 / 避雷帖 ---------- */
export function getExperiencePosts(state, { type = "", scenario = "", q = "" } = {}) {
  let list = state.experiencePosts.filter((x) => x.status !== "hidden");
  if (type === "promo") list = list.filter((x) => x.postType === "promo");
  else if (type === "experience" || type === "avoid") list = list.filter((x) => x.postType === type);
  else list = list.filter((x) => x.postType !== "promo"); // 信任池默认排除推广帖
  if (scenario) list = list.filter((x) => x.scenarioType === scenario);
  if (q) {
    const kw = q.toLowerCase();
    list = list.filter((x) => x.title.toLowerCase().includes(kw) || x.content.toLowerCase().includes(kw));
  }
  return [...list].sort((a, b) => hotScorePost(b) - hotScorePost(a));
}

export function getExperiencePost(state, id) {
  const post = state.experiencePosts.find((x) => x.id === id);
  if (!post) return null;
  const author = state.users.find((u) => u.id === post.authorId);
  return {
    ...post,
    author,
    school: state.schools.find((s) => s.id === post.schoolId) ?? null,
    major: state.majors.find((m) => m.id === post.majorId) ?? null,
    course: state.courses.find((c) => c.id === post.courseId) ?? null,
    teacher: state.teachers.find((t) => t.id === post.teacherId) ?? null,
  };
}

export function createExperiencePost(state, { title, content, postType, scenarioType, schoolId, majorId, courseId, teacherId, images, merchantId, merchantName, mode, sourceReplyId, sourceQuestionId }) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  if (!title) throw new Error("请填写标题");
  if (!content) throw new Error("请填写正文");
  if (!["experience", "avoid", "promo"].includes(postType)) throw new Error("帖子类型不正确");
  if (postType === "promo" && !merchantId && !merchantName) throw new Error("推广帖必须选择或填写商户");
  if (/微信|qq|vx|手机号|电话|保录取|代写|收款|扫码|加我|联系我|http|转账/i.test(title + content)) {
    throw new Error("内容疑似广告/中介，请移除联系方式或营销信息");
  }
  // 回复升级/引用来源校验（对应主应用 API，本地简化防刷：同一作者同一回复只能一次）
  let srcReply = null;
  const srcId = sourceReplyId || null;
  if (srcId) {
    srcReply = state.replies.find((r) => r.id === srcId) ?? null;
    if (!srcReply) throw new Error("来源回复不存在");
    if (srcReply.status === "hidden") throw new Error("来源回复已被隐藏，无法操作");
    if (sourceQuestionId && srcReply.questionId !== sourceQuestionId) throw new Error("来源问题与回复不匹配");
    const dup = state.experiencePosts.some((x) => x.sourceReplyId === srcId && x.authorId === user.id);
    if (dup) throw new Error("这条回复你已升级/引用过帖子了");
    if (srcReply.authorId !== user.id && mode !== "quote") throw new Error("只能将自己发布的回复升级为帖子；引用他人的回复请使用「引用发帖」");
    if (mode === "quote") {
      const ownPart = content.split(srcReply.content).join("").replace(/[\s“”"「」『』《》【】（）()：:，,。.、；;…\-]/g, "");
      if (ownPart.length < 10) throw new Error("引用发帖需在原回复基础上补充至少 10 字自己的内容");
    }
  }
  // —— 商户关联（v4.7 §8.17）：promo 帖必须关联商户；仅填名称时按名查找或自动建档 ——
  let merchant = null;
  if (postType === "promo") {
    if (merchantId) {
      merchant = state.merchants.find((m) => m.id === merchantId) ?? null;
      if (!merchant || merchant.status === "removed") throw new Error("商户不存在或不可用，请重新选择");
    } else if (merchantName) {
      merchant = state.merchants.find((m) => m.name === merchantName && m.status !== "removed") ?? createMerchant(state, { name: merchantName, schoolId: schoolId || null });
    }
  }


  const post = {
    id: uid("p"),
    authorId: user.id,
    title,
    content,
    postType,
    scenarioType: scenarioType || null,
    schoolId: schoolId || null,
    majorId: majorId || null,
    courseId: courseId || null,
    teacherId: teacherId || null,
    merchantName: postType === "promo" ? (merchant ? merchant.name : merchantName) : null,
    merchantId: postType === "promo" ? (merchant ? merchant.id : merchantId) : null,
    images: JSON.stringify(images || []),
    sourceReplyId: srcReply ? srcReply.id : null,
    sourceQuestionId: srcReply ? srcReply.questionId : (sourceQuestionId || null),
    mode: mode === "quote" ? "quote" : "upgrade",
    likeCount: 0,
    favoriteCount: 0,
    status: "visible",
    createdAt: new Date().toISOString(),
  };
  state.experiencePosts.push(post);
  if (postType === "promo") {
    user.trustScore = (user.trustScore || 0) + 5;
  }
  if (srcReply && mode === "quote" && srcReply.authorId !== user.id) {
    const srcAuthor = state.users.find((u) => u.id === srcReply.authorId);
    notify(state, srcReply.authorId, "reply", { type: "quote", actorId: user.id, actorName: user.nickname, postId: post.id, postKind: "experience_post", questionId: srcReply.questionId, sourceReplyId: srcReply.id });
  }
  saveState(state);
  return post;
}

/* ---------- 商户（v4.7 §8.17 商户与生活推荐体系） ---------- */
export function listMerchants(state, { q = "", category = "" } = {}) {
  let list = state.merchants.filter((m) => m.status !== "removed");
  if (category) list = list.filter((m) => m.category === category);
  if (q) {
    const kw = q.toLowerCase();
    list = list.filter((m) => m.name.toLowerCase().includes(kw));
  }
  return list.map((m) => ({
    ...m,
    postCount: state.experiencePosts.filter((x) => x.status !== "hidden" && (x.merchantId === m.id || (x.merchantName && x.merchantName === m.name))).length,
  }));
}

export function getMerchant(state, id) {
  const merchant = state.merchants.find((m) => m.id === id);
  if (!merchant || merchant.status === "removed") return null;
  const posts = state.experiencePosts
    .filter((x) => x.status !== "hidden" && (x.merchantId === id || (x.merchantName && x.merchantName === merchant.name)))
    .sort((a, b) => hotScorePost(b) - hotScorePost(a));
  return { merchant, posts };
}

export function merchantOf(state, post) {
  if (!post) return null;
  if (post.merchantId) return state.merchants.find((m) => m.id === post.merchantId) ?? null;
  if (post.merchantName) return state.merchants.find((m) => m.name === post.merchantName) ?? null;
  return null;
}

export function createMerchant(state, { name, category = "campus_food", tier = "street", schoolId = null, city = "", address = "", description = "" }) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  const n = String(name || "").trim().slice(0, 80);
  if (!n) throw new Error("请填写商户名称");
  if (!MERCHANT_CATEGORIES.some((x) => x.key === category)) throw new Error("商户分类不正确");
  const existing = state.merchants.find((m) => m.name === n && m.status !== "removed");
  if (existing) return existing;
  const merchant = { id: uid("m"), name: n, category, tier: tier === "chain" ? "chain" : "street", claimStatus: "unclaimed", schoolId: schoolId || null, city: (city || "").trim().slice(0, 50) || null, address: (address || "").trim().slice(0, 200) || null, description: (description || "").trim().slice(0, 500) || "", creditScore: 0, status: "active", createdAt: new Date().toISOString() };
  state.merchants.push(merchant);
  saveState(state);
  return merchant;
}


/* ---------- star ---------- */
export function toggleStar(state, targetType, targetId) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  const idx = state.myStars.findIndex((s) => s.userId === user.id && s.targetType === targetType && s.targetId === targetId);
  let active = false;
  if (idx >= 0) {
    state.myStars.splice(idx, 1);
  } else {
    state.myStars.push({ userId: user.id, targetType, targetId });
    active = true;
  }
  saveState(state);
  return active;
}

export function isStarred(state, targetType, targetId) {
  const user = getCurrentUser(state);
  if (!user) return false;
  return state.myStars.some((s) => s.userId === user.id && s.targetType === targetType && s.targetId === targetId);
}

export function starCountFor(state, targetType, targetId) {
  const base = (() => {
    if (targetType === "question") return state.questions.find((x) => x.id === targetId)?.starCount ?? 0;
    if (targetType === "reply") return state.replies.find((x) => x.id === targetId)?.starCount ?? 0;
    if (targetType === "experience_post") return state.experiencePosts.find((x) => x.id === targetId)?.likeCount ?? 0;
    return state.aiPosts.find((x) => x.id === targetId)?.starCount ?? 0;
  })();
  return base + (isStarred(state, targetType, targetId) ? 1 : 0);
}

export function toggleFavorite(state, targetType, targetId) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  const idx = state.myFavorites.findIndex((s) => s.userId === user.id && s.targetType === targetType && s.targetId === targetId);
  let active = false;
  if (idx >= 0) {
    state.myFavorites.splice(idx, 1);
  } else {
    state.myFavorites.push({ userId: user.id, targetType, targetId });
    active = true;
  }
  saveState(state);
  return active;
}

export function isFavorited(state, targetType, targetId) {
  const user = getCurrentUser(state);
  if (!user) return false;
  return state.myFavorites.some((s) => s.userId === user.id && s.targetType === targetType && s.targetId === targetId);
}

export function favoriteCountFor(state, targetType, targetId) {
  const base = (() => {
    if (targetType === "question") return state.questions.find((x) => x.id === targetId)?.favoriteCount ?? 0;
    if (targetType === "reply") return state.replies.find((x) => x.id === targetId)?.favoriteCount ?? 0;
    if (targetType === "experience_post") return state.experiencePosts.find((x) => x.id === targetId)?.favoriteCount ?? 0;
    return state.aiPosts.find((x) => x.id === targetId)?.favoriteCount ?? 0;
  })();
  return base + (isFavorited(state, targetType, targetId) ? 1 : 0);
}

/* ---------- 关注 ---------- */
export function isFollowing(state, a, b) {
  return state.follows.some((f) => f.followerId === a && f.followingId === b);
}
export function isMutual(state, a, b) {
  return isFollowing(state, a, b) && isFollowing(state, b, a);
}
export function toggleFollow(state, targetUserId) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  if (targetUserId === user.id) throw new Error("不能关注自己");
  const idx = state.follows.findIndex((f) => f.followerId === user.id && f.followingId === targetUserId);
  let following = false;
  if (idx >= 0) {
    state.follows.splice(idx, 1);
  } else {
    state.follows.push({ followerId: user.id, followingId: targetUserId });
    following = true;
    notify(state, targetUserId, "follow", { type: "follow", actorId: user.id, actorName: user.nickname });
  }
  saveState(state);
  return following;
}
export function followerCount(state, userId) {
  return state.follows.filter((f) => f.followingId === userId).length;
}
export function followingCount(state, userId) {
  return state.follows.filter((f) => f.followerId === userId).length;
}

/* ---------- 消息 ---------- */
function convKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function getOrCreateConversation(state, a, b) {
  const key = convKey(a, b);
  let conv = state.conversations.find((c) => c.id === key);
  if (!conv) {
    conv = { id: key, users: [a, b], messages: [], createdAt: new Date().toISOString() };
    state.conversations.push(conv);
    saveState(state);
  }
  return conv;
}

export function getConversations(state) {
  const user = getCurrentUser(state);
  if (!user) return [];
  return state.conversations
    .filter((c) => c.users.includes(user.id))
    .map((c) => {
      const otherId = c.users.find((id) => id !== user.id);
      const other = state.users.find((u) => u.id === otherId);
      const messages = c.messages;
      const unread = messages.filter((m) => m.senderId !== user.id && !m.readAt).length;
      return { ...c, other, unread, lastMessage: messages[messages.length - 1] ?? null };
    })
    .sort((a, b) => new Date(b.lastMessage?.createdAt ?? b.createdAt) - new Date(a.lastMessage?.createdAt ?? a.createdAt));
}

export function getConversation(state, id) {
  const user = getCurrentUser(state);
  if (!user) return null;
  const c = state.conversations.find((x) => x.id === id && x.users.includes(user.id));
  if (!c) return null;
  const otherId = c.users.find((uid) => uid !== user.id);
  const other = state.users.find((u) => u.id === otherId);
  return { ...c, other, mutual: isMutual(state, user.id, otherId) };
}

export function sendMessage(state, toUserId, content) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  const text = content.trim();
  if (!text) throw new Error("消息内容不能为空");
  if (toUserId === user.id) throw new Error("不能给自己发消息");
  const toUser = state.users.find((u) => u.id === toUserId);
  if (!toUser) throw new Error("用户不存在");
  const key = convKey(user.id, toUserId);
  let conv = state.conversations.find((c) => c.id === key);
  if (!conv) {
    conv = { id: key, users: [user.id, toUserId], messages: [], createdAt: new Date().toISOString() };
    state.conversations.push(conv);
  }
  const mutual = isMutual(state, user.id, toUserId);
  if (!mutual) {
    const sent = conv.messages.filter((m) => m.senderId === user.id).length;
    if (sent >= 1) {
      throw new Error("你们还没有互相关注，只能发送一条打招呼消息。互相关注后即可畅聊。");
    }
  }
  const message = {
    id: uid("m"),
    senderId: user.id,
    content: text,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  conv.messages.push(message);
  notify(state, toUserId, "message", { type: "message", actorId: user.id, actorName: user.nickname, content: text.slice(0, 50), conversationId: conv.id });
  saveState(state);
  return { message, mutual };
}

export function markConversationRead(state, conversationId) {
  const user = getCurrentUser(state);
  if (!user) return;
  const c = state.conversations.find((x) => x.id === conversationId);
  if (!c) return;
  for (const m of c.messages) {
    if (m.senderId !== user.id && !m.readAt) m.readAt = new Date().toISOString();
  }
  saveState(state);
}

/* ---------- 通知 ---------- */
export function notify(state, userId, type, payload) {
  state.notifications.push({
    id: uid("n"),
    userId,
    type,
    payload,
    createdAt: new Date().toISOString(),
    readAt: null,
  });
}

export function getNotifications(state) {
  const user = getCurrentUser(state);
  if (!user) return [];
  return state.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function unreadCounts(state) {
  const user = getCurrentUser(state);
  if (!user) return { notifications: 0, messages: 0 };
  const notifications = state.notifications.filter((n) => n.userId === user.id && !n.readAt).length;
  const messages = state.conversations
    .filter((c) => c.users.includes(user.id))
    .reduce((sum, c) => sum + c.messages.filter((m) => m.senderId !== user.id && !m.readAt).length, 0);
  return { notifications, messages };
}

export function markAllNotificationsRead(state) {
  const user = getCurrentUser(state);
  if (!user) return;
  for (const n of state.notifications) {
    if (n.userId === user.id && !n.readAt) n.readAt = new Date().toISOString();
  }
  saveState(state);
}

/* ---------- 档案 / 评价 ---------- */
export function schoolStats(state) {
  return state.schools.map((school) => {
    const reviewCount = state.reviews.filter((r) => r.schoolId === school.id && r.status !== "hidden").length;
    const majorCount = new Set(
      state.courses.filter((c) => c.schoolId === school.id).map((c) => c.majorId).filter(Boolean)
    ).size;
    const teacherCount = state.teachers.filter((t) => t.schoolId === school.id).length;
    const schoolTag = state.tags.find((t) => t.name === school.name && t.type === "school");
    const questionCount = schoolTag
      ? state.questions.filter(
          (q) => q.status !== "hidden" && state.questionTags.some((qt) => qt.questionId === q.id && qt.tagId === schoolTag.id)
        ).length
      : 0;
    return { ...school, reviewCount, majorCount, teacherCount, questionCount };
  });
}

export function getSchool(state, slug) {
  const school = state.schools.find((s) => s.slug === slug);
  if (!school) return null;
  const reviews = state.reviews.filter((r) => r.schoolId === school.id && !r.courseId && !r.teacherId && r.status !== "hidden");
  const courses = state.courses.filter((c) => c.schoolId === school.id).map((c) => ({ ...c, major: state.majors.find((m) => m.id === c.majorId) ?? null }));
  const teachers = state.teachers.filter((t) => t.schoolId === school.id);
  const questions = state.questions.filter((q) =>
    state.questionTags.some((qt) => qt.questionId === q.id && qt.tagId === state.tags.find((t) => t.name === school.name)?.id)
  );
  return { ...school, reviews, courses, teachers, questions };
}

export function getMajor(state, slug) {
  const major = state.majors.find((m) => m.slug === slug);
  if (!major) return null;
  const courses = state.courses.filter((c) => c.majorId === major.id);
  const reviews = state.reviews.filter((r) => r.majorId === major.id && r.status !== "hidden");
  const questions = state.questions.filter((q) =>
    state.questionTags.some((qt) => qt.questionId === q.id && qt.tagId === state.tags.find((t) => t.name === major.name)?.id)
  );
  return { ...major, courses, reviews, questions };
}

export function getCourse(state, id) {
  const course = state.courses.find((c) => c.id === id);
  if (!course) return null;
  const school = state.schools.find((s) => s.id === course.schoolId);
  const major = state.majors.find((m) => m.id === course.majorId) ?? null;
  const reviews = state.reviews.filter((r) => r.courseId === id && r.status !== "hidden");
  return { ...course, school, major, reviews: reviews.map((r) => ({ ...r, author: state.users.find((u) => u.id === r.authorId) })) };
}

export function getTeacher(state, id) {
  const teacher = state.teachers.find((t) => t.id === id);
  if (!teacher) return null;
  const school = state.schools.find((s) => s.id === teacher.schoolId);
  const reviews = state.reviews.filter((r) => r.teacherId === id && r.status !== "hidden");
  return { ...teacher, school, reviews: reviews.map((r) => ({ ...r, author: state.users.find((u) => u.id === r.authorId) })) };
}

export function createReview(state, input) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  const school = state.schools.find((s) => s.id === input.schoolId);
  if (!school) throw new Error("学校不存在");
  const verified = JSON.parse(user.verifiedSchools || "[]");
  if (!verified.includes(school.name)) throw new Error("只有通过该校邮箱认证的用户可以发表结构化评价");
  const review = {
    id: uid("v"),
    authorId: user.id,
    schoolId: input.schoolId,
    majorId: input.majorId ?? null,
    courseId: input.courseId ?? null,
    teacherId: input.teacherId ?? null,
    degreeLevel: input.degreeLevel ?? "bachelor",
    enrolledYear: input.enrolledYear ?? null,
    isAlumni: Boolean(input.isAlumni),
    ratings: JSON.stringify(input.ratings || {}),
    content: input.content ?? "",
    status: "visible",
    createdAt: new Date().toISOString(),
  };
  state.reviews.push(review);
  saveState(state);
  return review;
}

/* ---------- 搜索 ---------- */
export function search(state, q) {
  const kw = (q || "").trim().toLowerCase();
  if (!kw) return { questions: [], schools: [], majors: [], courses: [], teachers: [], experiencePosts: [] };
  return {
    questions: state.questions.filter((x) => x.status !== "hidden" && (x.title.toLowerCase().includes(kw) || (x.description || "").toLowerCase().includes(kw))).slice(0, 10),
    schools: state.schools.filter((s) => s.name.toLowerCase().includes(kw)).slice(0, 5),
    majors: state.majors.filter((m) => m.name.toLowerCase().includes(kw)).slice(0, 5),
    courses: state.courses.filter((c) => c.name.toLowerCase().includes(kw)).slice(0, 6),
    teachers: state.teachers.filter((t) => t.name.toLowerCase().includes(kw) || (t.department || "").toLowerCase().includes(kw)).slice(0, 6),
    experiencePosts: state.experiencePosts.filter((x) => x.status !== "hidden" && x.postType !== "promo" && (x.title.toLowerCase().includes(kw) || x.content.toLowerCase().includes(kw))).slice(0, 6),
  };
}

export function formatRelative(dateStr) {
  const ts = new Date(dateStr).getTime();
  const diff = Date.now() - ts;
  const min = 60000, hour = 3600000, day = 86400000;
  if (diff < min) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
