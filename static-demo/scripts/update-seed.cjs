const fs = require("fs");
const path = "D:/星程/uni-insight/static-demo/src/data/seed.json";
const seed = JSON.parse(fs.readFileSync(path, "utf8"));

const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// 1) favoriteCount 演示值
const mainQ = seed.questions.find((q) => q.title.includes("中山大学经济系到底怎么样"));
if (mainQ) mainQ.favoriteCount = 4;
const aiPost = seed.aiPosts.find((p) => p.title.includes("中大经济学真实就读体验与就业观察"));
if (aiPost) aiPost.favoriteCount = 3;
const mainReplies = seed.replies.filter((r) => r.questionId === mainQ?.id);
const favReplyMap = { 0: 3, 1: 4, 5: 2 };
for (const [idx, count] of Object.entries(favReplyMap)) {
  const r = mainReplies[Number(idx)];
  if (r) r.favoriteCount = count;
}

// 2) experiencePosts
const userId = (nick) => seed.users.find((u) => u.nickname === nick)?.id;
const school = (name) => seed.schools.find((s) => s.name === name)?.id;
const major = (name) => seed.majors.find((m) => m.name === name)?.id;
const course = (code) => seed.courses.find((c) => c.code === code)?.id;

seed.experiencePosts = [
  {
    id: uid("p"),
    authorId: userId("中大经济学长"),
    title: "中大经济学四年真实就读体验：课程、实习与就业",
    content: "大一高数线代打基础，大二微观宏观+计量，课程偏理论但训练很扎实。\n\n想进金融圈一定要自己补实习：大二暑假开始找，秋招前至少两段相关经历。就业主要去向是银行、券商、咨询和考公，研究生学历对进头部岗位帮助明显。\n\n给高考生的建议：如果目标是珠三角金融圈，中大经济学的校友网络是很实际的资源；如果更想做学术，可以多看看厦大王亚南研究院。",
    postType: "experience",
    scenarioType: "gaokao",
    schoolId: school("中山大学"),
    majorId: major("经济学"),
    courseId: null,
    teacherId: null,
    images: "[]",
    likeCount: 8,
    favoriteCount: 5,
    status: "visible",
    createdAt: "2026-08-25T14:30:00.000Z",
  },
  {
    id: uid("p"),
    authorId: userId("中大在读学姐"),
    title: "避雷：计量经济学选课前，先搞清楚这三件事",
    content: "1. 数学要求比想象高，高数线代概率论没学扎实会很吃力；\n2. 建议提前看伍德里奇，光靠听课跟不上；\n3. 小组作业很多，找靠谱队友很重要，别等到期末才组队。\n\n如果有转专业或保研打算，计量成绩很关键，别选在最忙的学期。",
    postType: "avoid",
    scenarioType: "transfer",
    schoolId: school("中山大学"),
    majorId: major("经济学"),
    courseId: course("ECON210"),
    teacherId: null,
    images: "[]",
    likeCount: 6,
    favoriteCount: 4,
    status: "visible",
    createdAt: "2026-08-25T15:10:00.000Z",
  },
  {
    id: uid("p"),
    authorId: userId("中大研二学长"),
    title: "考研上岸中大经济学：我的时间线与踩坑总结",
    content: "3 月开始准备，专业课重点是中级宏观和中级微观，数学按数三难度准备。\n\n踩过的坑：真题很重要，但更要把课本吃透；别迷信押题。\n\n复试看综合能力和英语，建议平时多练表达。保研的同学成绩前 20% 左右有机会，科研经历是加分项。",
    postType: "experience",
    scenarioType: "grad_cn",
    schoolId: school("中山大学"),
    majorId: major("经济学"),
    courseId: null,
    teacherId: null,
    images: "[]",
    likeCount: 5,
    favoriteCount: 3,
    status: "visible",
    createdAt: "2026-08-25T16:00:00.000Z",
  },
  {
    id: uid("p"),
    authorId: userId("厦大经济学姐"),
    title: "中大 vs 厦大经济学：两所学校都接触过的真实对比",
    content: "厦大经济学科沉淀更久，学术氛围浓，王亚南研究院的计量训练很硬核；中大胜在大湾区的实习便利和校友网络。\n\n想就业留广东选中大，想走学术可以多看厦大。两边课程都偏理论，具体岗位技能都要自己补。",
    postType: "experience",
    scenarioType: "gaokao",
    schoolId: school("厦门大学"),
    majorId: major("经济学"),
    courseId: null,
    teacherId: null,
    images: "[]",
    likeCount: 4,
    favoriteCount: 3,
    status: "visible",
    createdAt: "2026-08-26T02:00:00.000Z",
  },
];

fs.writeFileSync(path, JSON.stringify(seed, null, 2), "utf8");
console.log("seed.json 更新完成: experiencePosts=" + seed.experiencePosts.length);