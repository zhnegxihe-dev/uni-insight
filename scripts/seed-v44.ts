/**
 * v4.4 增量演示数据（只增不删）：
 * - 不调用 clean()，不清空任何表；
 * - 仅为新功能补充演示数据：经验帖/避雷帖 + 收藏（ContentFavorite + favoriteCount）。
 * 幂等：已存在的内容（按标题匹配）跳过。
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = (email: string) =>
    prisma.user.findUnique({ where: { email }, select: { id: true } });
  const alumni = await user("alumni@demo.uni");
  const student = await user("student@demo.uni");
  const grad = await user("grad@demo.uni");
  const xmu = await user("xmu@demo.uni");
  if (!alumni || !student || !grad || !xmu) {
    throw new Error("演示用户缺失，请先运行完整 seed 或检查数据库");
  }
  const allUsers = await prisma.user.findMany({ select: { id: true } });

  const sysu = await prisma.school.findUnique({ where: { slug: "sysu" }, select: { id: true } });
  const xmuSchool = await prisma.school.findUnique({ where: { slug: "xmu" }, select: { id: true } });
  const economics = await prisma.major.findUnique({ where: { slug: "economics" }, select: { id: true } });
  const econometrics = await prisma.course.findFirst({
    where: { code: "ECON210" },
    select: { id: true },
  });
  if (!sysu || !xmuSchool || !economics) throw new Error("学校/专业数据缺失");

  const users = allUsers.map((u) => u.id);
  async function addLikesFavorites(
    targetType: "question" | "reply" | "ai_post" | "experience_post",
    targetId: string,
    likeCount: number,
    favoriteCount: number,
    excludeUserId?: string
  ) {
    const pool = users.filter((id) => id !== excludeUserId);
    // 点赞（contentStar，幂等：已存在则跳过）
    for (const userId of pool.slice(0, likeCount)) {
      const exists = await prisma.contentStar.findUnique({
        where: { userId_targetType_targetId: { userId, targetType, targetId } },
      });
      if (!exists) await prisma.contentStar.create({ data: { userId, targetType, targetId } });
    }
    // 收藏（contentFavorite，幂等）
    for (const userId of pool.slice(0, favoriteCount)) {
      const exists = await prisma.contentFavorite.findUnique({
        where: { userId_targetType_targetId: { userId, targetType, targetId } },
      });
      if (!exists) await prisma.contentFavorite.create({ data: { userId, targetType, targetId } });
    }
  }

  // 1) 现有内容补充收藏计数
  const mainQuestion = await prisma.question.findFirst({
    where: { title: { contains: "中山大学经济系到底怎么样" } },
    select: { id: true, authorId: true },
  });
  if (mainQuestion) {
    await addLikesFavorites("question", mainQuestion.id, 0, 4, mainQuestion.authorId);
    await prisma.question.update({ where: { id: mainQuestion.id }, data: { favoriteCount: 4 } });
  }

  const aiPost = await prisma.aiPost.findFirst({
    where: { title: "中大经济学真实就读体验与就业观察" },
    select: { id: true, authorId: true },
  });
  if (aiPost) {
    await addLikesFavorites("ai_post", aiPost.id, 0, 3, aiPost.authorId);
    await prisma.aiPost.update({ where: { id: aiPost.id }, data: { favoriteCount: 3 } });
  }

  const replyFavs = [
    { index: 0, count: 3 },
    { index: 1, count: 4 },
    { index: 5, count: 2 },
  ];
  if (mainQuestion) {
    const replies = await prisma.reply.findMany({
      where: { questionId: mainQuestion.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, authorId: true },
    });
    for (const item of replyFavs) {
      const reply = replies[item.index];
      if (!reply) continue;
      await addLikesFavorites("reply", reply.id, 0, item.count, reply.authorId);
      await prisma.reply.update({ where: { id: reply.id }, data: { favoriteCount: item.count } });
    }
  }

  // 2) 经验帖 / 避雷帖（按标题幂等）
  const seedPosts = [
    {
      authorId: alumni.id,
      title: "中大经济学四年真实就读体验：课程、实习与就业",
      content:
        "大一高数线代打基础，大二微观宏观+计量，课程偏理论但训练很扎实。\n\n想进金融圈一定要自己补实习：大二暑假开始找，秋招前至少两段相关经历。就业主要去向是银行、券商、咨询和考公，研究生学历对进头部岗位帮助明显。\n\n给高考生的建议：如果目标是珠三角金融圈，中大经济学的校友网络是很实际的资源；如果更想做学术，可以多看看厦大王亚南研究院。",
      postType: "experience",
      scenarioType: "gaokao",
      schoolId: sysu.id,
      majorId: economics.id,
      likeCount: 8,
      favoriteCount: 5,
    },
    {
      authorId: student.id,
      title: "避雷：计量经济学选课前，先搞清楚这三件事",
      content:
        "1. 数学要求比想象高，高数线代概率论没学扎实会很吃力；\n2. 建议提前看伍德里奇，光靠听课跟不上；\n3. 小组作业很多，找靠谱队友很重要，别等到期末才组队。\n\n如果有转专业或保研打算，计量成绩很关键，别选在最忙的学期。",
      postType: "avoid",
      scenarioType: "transfer",
      schoolId: sysu.id,
      majorId: economics.id,
      courseId: econometrics?.id ?? null,
      likeCount: 6,
      favoriteCount: 4,
    },
    {
      authorId: grad.id,
      title: "考研上岸中大经济学：我的时间线与踩坑总结",
      content:
        "3 月开始准备，专业课重点是中级宏观和中级微观，数学按数三难度准备。\n\n踩过的坑：真题很重要，但更要把课本吃透；别迷信押题。\n\n复试看综合能力和英语，建议平时多练表达。保研的同学成绩前 20% 左右有机会，科研经历是加分项。",
      postType: "experience",
      scenarioType: "grad_cn",
      schoolId: sysu.id,
      majorId: economics.id,
      likeCount: 5,
      favoriteCount: 3,
    },
    {
      authorId: xmu.id,
      title: "中大 vs 厦大经济学：两所学校都接触过的真实对比",
      content:
        "厦大经济学科沉淀更久，学术氛围浓，王亚南研究院的计量训练很硬核；中大胜在大湾区的实习便利和校友网络。\n\n想就业留广东选中大，想走学术可以多看厦大。两边课程都偏理论，具体岗位技能都要自己补。",
      postType: "experience",
      scenarioType: "gaokao",
      schoolId: xmuSchool.id,
      majorId: economics.id,
      likeCount: 4,
      favoriteCount: 3,
    },
  ];

  for (const item of seedPosts) {
    const exists = await prisma.experiencePost.findFirst({ where: { title: item.title } });
    if (exists) {
      console.log(`跳过（已存在）：${item.title}`);
      continue;
    }
    const post = await prisma.experiencePost.create({
      data: {
        authorId: item.authorId,
        title: item.title,
        content: item.content,
        postType: item.postType as "experience" | "avoid",
        scenarioType: item.scenarioType,
        schoolId: item.schoolId,
        majorId: item.majorId,
        courseId: item.courseId ?? null,
        images: "[]",
        likeCount: item.likeCount,
        favoriteCount: item.favoriteCount,
      },
    });
    await addLikesFavorites("experience_post", post.id, item.likeCount, item.favoriteCount, item.authorId);
    console.log(`已创建：${item.title}（点赞 ${item.likeCount} / 收藏 ${item.favoriteCount}）`);
  }

  console.log("v4.4 增量演示数据完成（只增不删）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());