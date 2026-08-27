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
        for (const q of parsed.questions) if (typeof q.favoriteCount !== "number") q.favoriteCount = 0;
        for (const r of parsed.replies) if (typeof r.favoriteCount !== "number") r.favoriteCount = 0;
        for (const p of parsed.aiPosts) if (typeof p.favoriteCount !== "number") p.favoriteCount = 0;
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

export function createReply(state, questionId, content) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  if (!content) throw new Error("回复内容不能为空");
  if (content.length > 280) throw new Error("回复最多 280 字");
  const question = state.questions.find((x) => x.id === questionId);
  if (!question) throw new Error("问题不存在");
  const reply = {
    id: uid("r"),
    questionId,
    authorId: user.id,
    content,
    starCount: 0,
    isAccepted: false,
    status: "visible",
    createdAt: new Date().toISOString(),
  };
  state.replies.push(reply);
  question.replyCount += 1;
  if (question.authorId !== user.id) {
    notify(state, question.authorId, "reply", { type: "reply", actorId: user.id, questionId, questionTitle: question.title });
  }
  saveState(state);
  return reply;
}
/* ---------- 经验帖 / 避雷帖 ---------- */
export function getExperiencePosts(state, { type = "", scenario = "", q = "" } = {}) {
  let list = state.experiencePosts.filter((x) => x.status !== "hidden");
  if (type === "experience" || type === "avoid") list = list.filter((x) => x.postType === type);
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

export function createExperiencePost(state, { title, content, postType, scenarioType, schoolId, majorId, courseId, teacherId, images }) {
  const user = getCurrentUser(state);
  if (!user) throw new Error("请先登录");
  if (!title) throw new Error("请填写标题");
  if (!content) throw new Error("请填写正文");
  if (!["experience", "avoid"].includes(postType)) throw new Error("帖子类型不正确");
  if (/微信|qq|vx|手机号|电话|保录取|代写|收款|扫码|加我|联系我|http|转账/i.test(title + content)) {
    throw new Error("内容疑似广告/中介，请移除联系方式或营销信息");
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
    images: JSON.stringify(images || []),
    likeCount: 0,
    favoriteCount: 0,
    status: "visible",
    createdAt: new Date().toISOString(),
  };
  state.experiencePosts.push(post);
  saveState(state);
  return post;
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
    experiencePosts: state.experiencePosts.filter((x) => x.status !== "hidden" && (x.title.toLowerCase().includes(kw) || x.content.toLowerCase().includes(kw))).slice(0, 6),
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
