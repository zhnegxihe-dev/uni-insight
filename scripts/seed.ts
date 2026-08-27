import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Test1234!";
const passwordHash = bcrypt.hashSync(PASSWORD, 10);

async function clean() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userAction.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.report.deleteMany();
  await prisma.schoolEmailDomain.deleteMany();
  await prisma.contentStar.deleteMany();
  await prisma.contentFavorite.deleteMany();
  await prisma.experiencePost.deleteMany();
  await prisma.aiPost.deleteMany();
  await prisma.aiSummary.deleteMany();
  await prisma.review.deleteMany();
  await prisma.questionTag.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.question.deleteMany();
  await prisma.course.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.major.deleteMany();
  await prisma.school.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clean();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@demo.uni",
        passwordHash,
        nickname: "平台管理员",
        bio: "负责内容审核与社区治理。",
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        email: "seeker@demo.uni",
        passwordHash,
        nickname: "高三考生小星",
        bio: "高考出分，正在研究志愿填报。",
        identity: JSON.stringify({ role: "gaokao", targetSchool: "中山大学", targetMajor: "经济学", region: "广东" }),
      },
    }),
    prisma.user.create({
      data: {
        email: "alumni@demo.uni",
        passwordHash,
        nickname: "中大经济学长",
        bio: "中山大学经济学毕业，现就职于券商。",
        verifiedSchools: JSON.stringify(["中山大学"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "student@demo.uni",
        passwordHash,
        nickname: "中大在读学姐",
        verifiedSchools: JSON.stringify(["中山大学"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "grad@demo.uni",
        passwordHash,
        nickname: "中大研二学长",
        verifiedSchools: JSON.stringify(["中山大学"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "graduate@demo.uni",
        passwordHash,
        nickname: "已毕业学长",
        verifiedSchools: JSON.stringify(["中山大学"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "xmu@demo.uni",
        passwordHash,
        nickname: "厦大经济学姐",
        verifiedSchools: JSON.stringify(["厦门大学"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "alumni2@demo.uni",
        passwordHash,
        nickname: "中大经济学院校友",
        verifiedSchools: JSON.stringify(["中山大学"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "sophomore@demo.uni",
        passwordHash,
        nickname: "中大金融学妹",
        verifiedSchools: JSON.stringify(["中山大学"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "xmu-alumni@demo.uni",
        passwordHash,
        nickname: "厦大经济校友",
        verifiedSchools: JSON.stringify(["厦门大学"]),
      },
    }),
  ]);

  const [admin, seeker, alumni, student, grad, graduate, xmu, alumni2, sysuSophomore, xmuAlumni] = users;

  const sysu = await prisma.school.create({
    data: {
      name: "中山大学",
      slug: "sysu",
      region: "广东",
      type: "综合",
      description: "教育部直属综合性大学，地处粤港澳大湾区，经济学与岭南学院拥有较强师资。",
      verified: true,
    },
  });
  const xmuSchool = await prisma.school.create({
    data: {
      name: "厦门大学",
      slug: "xmu",
      region: "福建",
      type: "综合",
      description: "地处厦门，经济学科历史悠久，王亚南经济研究院影响力较大。",
      verified: true,
    },
  });

  // 学校邮箱域名映射（学校邮箱认证演示模式）
  await prisma.schoolEmailDomain.createMany({
    data: [
      { schoolId: sysu.id, domain: "sysu.edu.cn", note: "中山大学官方邮箱" },
      { schoolId: sysu.id, domain: "mail2.sysu.edu.cn", note: "中山大学备用邮箱" },
      { schoolId: xmuSchool.id, domain: "xmu.edu.cn", note: "厦门大学官方邮箱" },
      { schoolId: xmuSchool.id, domain: "stu.xmu.edu.cn", note: "厦门大学学生邮箱" },
    ],
  });

  const economics = await prisma.major.create({
    data: { name: "经济学", slug: "economics", category: "经济学类" },
  });
  const finance = await prisma.major.create({
    data: { name: "金融学", slug: "finance", category: "金融学类" },
  });
  const cs = await prisma.major.create({
    data: { name: "计算机科学与技术", slug: "computer-science", category: "计算机类" },
  });

  const micro = await prisma.course.create({
    data: { schoolId: sysu.id, majorId: economics.id, name: "微观经济学", code: "ECON101" },
  });
  const macro = await prisma.course.create({
    data: { schoolId: sysu.id, majorId: economics.id, name: "宏观经济学", code: "ECON102" },
  });
  const econometrics = await prisma.course.create({
    data: { schoolId: sysu.id, majorId: economics.id, name: "计量经济学", code: "ECON210" },
  });
  const financeCourse = await prisma.course.create({
    data: { schoolId: sysu.id, majorId: finance.id, name: "金融学", code: "FIN101" },
  });
  const intlFinance = await prisma.course.create({
    data: { schoolId: sysu.id, majorId: finance.id, name: "国际金融", code: "FIN201" },
  });
  const industryEco = await prisma.course.create({
    data: { schoolId: sysu.id, majorId: economics.id, name: "产业经济学", code: "ECON330" },
  });
  const xmuMicro = await prisma.course.create({
    data: { schoolId: xmuSchool.id, majorId: economics.id, name: "中级微观经济学", code: "ECON301" },
  });
  const xmuEconometrics = await prisma.course.create({
    data: { schoolId: xmuSchool.id, majorId: economics.id, name: "计量经济学", code: "ECON211" },
  });
  const xmuFinance = await prisma.course.create({
    data: { schoolId: xmuSchool.id, majorId: finance.id, name: "金融学", code: "FIN101" },
  });

  const teacher = await prisma.teacher.create({
    data: {
      schoolId: sysu.id,
      name: "王教授",
      department: "经济学院",
      title: "教授",
    },
  });
  const zhang = await prisma.teacher.create({
    data: {
      schoolId: sysu.id,
      name: "张老师",
      department: "经济学院",
      title: "讲师",
    },
  });
  const chen = await prisma.teacher.create({
    data: {
      schoolId: sysu.id,
      name: "陈教授",
      department: "经济学院",
      title: "教授",
    },
  });
  const li = await prisma.teacher.create({
    data: {
      schoolId: xmuSchool.id,
      name: "李教授",
      department: "经济学院",
      title: "教授",
    },
  });
  const zhao = await prisma.teacher.create({
    data: {
      schoolId: xmuSchool.id,
      name: "赵老师",
      department: "经济学院",
      title: "副教授",
    },
  });

  const tags: Record<string, string> = {};
  const tagDefs = [
    ["中山大学", "school", "sysu"],
    ["厦门大学", "school", "xmu"],
    ["经济学", "major", "economics"],
    ["金融学", "major", "finance"],
    ["计算机", "major", "computer-science"],
    ["本科", "degree", "bachelor"],
    ["硕士", "degree", "master"],
    ["高考志愿", "scenario", "gaokao"],
    ["转专业", "scenario", "transfer"],
    ["考研保研", "scenario", "grad-cn"],
    ["申研留学", "scenario", "grad-abroad"],
    ["导师选择", "scenario", "advisor"],
    ["就业行业", "scenario", "career"],
    ["广东", "region", "guangdong"],
    ["金融", "industry", "finance-industry"],
  ] as const;
  for (const [name, type, slug] of tagDefs) {
    const tag = await prisma.tag.create({
      data: { name, slug, type },
    });
    tags[name] = tag.id;
  }

  async function linkTags(questionId: string, names: string[]) {
    await prisma.questionTag.createMany({
      data: names.map((name) => ({ questionId, tagId: tags[name] })),
    });
  }

  const replySeed = [
    {
      author: student,
      content:
        "课程从微观/宏观经济学开始，大二上计量，数学要求不低，高数线代概率论都要学扎实。总体偏理论，想往金融走要自己补实习。",
      stars: 9,
    },
    {
      author: alumni,
      content:
        "毕业去向主要是银行、券商、咨询和考公。想进头部券商基本要研究生学历，本科直接就业一般从银行客户经理或企业财务起步。",
      stars: 12,
    },
    {
      author: graduate,
      content:
        "就业看个人，不只看专业。实习经历比绩点重要，大三暑假开始找实习，大四秋招前至少要有两段相关经历。",
      stars: 7,
    },
    {
      author: grad,
      content:
        "本科中大经济学保研率不低，成绩前 20% 左右有机会；考研竞争激烈，专业课重点是中级宏观和微观。",
      stars: 6,
    },
    {
      author: student,
      content:
        "老师整体负责，计量经济学比较硬核，建议提前看伍德里奇。小组作业多，比较锻炼人。",
      stars: 5,
    },
    {
      author: alumni2,
      content:
        "行业环境：金融行业现在内卷，投行和研究岗门槛高，但经济学训练对考公、咨询、互联网商业分析都算通用。",
      stars: 10,
    },
    {
      author: alumni,
      content:
        "选专业别只看名字。经济学不等于教你怎么赚钱，本科更多是分析框架和思维训练，具体岗位技能要靠实习和自学。",
      stars: 8,
    },
    {
      author: student,
      content:
        "大一高数线代，大二微观宏观计量，大三金融学、国际金融、产业组织等选修。课程压力中等偏上。",
      stars: 4,
    },
    {
      author: grad,
      content:
        "导师资源很重要，想做学术选研究型导师，想就业选有产业资源的导师，最好提前了解课题组毕业去向。",
      stars: 3,
    },
    {
      author: xmu,
      content:
        "我在厦大读经济，和中大对比：厦大经济学科沉淀更久，但中大在珠三角金融圈的校友网络更密。",
      stars: 3,
    },
    {
      author: alumni2,
      content:
        "现在咨询行业在收缩，但经济学的逻辑训练仍有优势，转型互联网运营和数据分析也比较常见。",
      stars: 2,
    },
    {
      author: alumni,
      content:
        "给分整体中规中矩，认真学 GPA 不难拿；大二开始可以蹭实习，就业信息多问校友。",
      stars: 1,
    },
  ];

  const mainQuestion = await prisma.question.create({
    data: {
      title: "中山大学经济系到底怎么样？课程学什么，就业如何？",
      description: "高考出分后想报中大经济学，想知道真实课程、就业和行业环境，求在读或毕业的学长学姐现身说法。",
      authorId: seeker.id,
      scenarioType: "gaokao",
      scenarioMeta: JSON.stringify({ province: "广东", scoreBand: "600 分 / 省排 8000", subjects: "物理+化学+生物", cityPref: "广东" }),
      degreeLevel: "bachelor",
      replyCount: replySeed.length,
      starCount: 5,
    },
  });
  await linkTags(mainQuestion.id, ["中山大学", "经济学", "本科", "高考志愿", "广东"]);

  const replies = [];
  for (const item of replySeed) {
    const reply = await prisma.reply.create({
      data: {
        questionId: mainQuestion.id,
        authorId: item.author.id,
        content: item.content,
        starCount: item.stars,
        isAccepted: item.author.id === alumni.id && item.stars === 12,
      },
    });
    replies.push(reply);
  }
  await prisma.question.update({
    where: { id: mainQuestion.id },
    data: { acceptedReplyId: replies[1].id },
  });

  async function seedStars(targetType: "question" | "reply" | "ai_post" | "experience_post", targetId: string, count: number, excludeUserId?: string) {
    const pool = users.filter((u) => u.id !== excludeUserId);
    const rows = pool.slice(0, Math.min(count, pool.length)).map((user) => ({
      userId: user.id,
      targetType,
      targetId,
    }));
    await prisma.contentStar.createMany({ data: rows });
  }

  async function seedFavorites(targetType: "question" | "reply" | "ai_post" | "experience_post", targetId: string, count: number, excludeUserId?: string) {
    const pool = users.filter((u) => u.id !== excludeUserId);
    const rows = pool.slice(0, Math.min(count, pool.length)).map((user) => ({
      userId: user.id,
      targetType,
      targetId,
    }));
    await prisma.contentFavorite.createMany({ data: rows });
  }

  await seedStars("question", mainQuestion.id, 5);
  for (const reply of replies) {
    const seed = replySeed.find((r) => r.content === reply.content);
    if (seed) {
      await seedStars("reply", reply.id, seed.stars, seed.author.id);
    }
  }

  // C 部分演示：一条广告回复（已被 3 次举报自动折叠，进入审核队列）
  const adReply = await prisma.reply.create({
    data: {
      questionId: mainQuestion.id,
      authorId: graduate.id,
      content: "想稳上中大经济学可以加微信 zhongda2026，保录取有名额，先到先得",
      starCount: 0,
      status: "folded",
    },
  });
  await prisma.report.createMany({
    data: [
      { reporterId: seeker.id, targetType: "reply", targetId: adReply.id, targetOwnerId: graduate.id, reason: "ad", detail: "明显是中介广告，留了微信号" },
      { reporterId: student.id, targetType: "reply", targetId: adReply.id, targetOwnerId: graduate.id, reason: "ad" },
      { reporterId: xmu.id, targetType: "reply", targetId: adReply.id, targetOwnerId: graduate.id, reason: "ad" },
    ],
  });
  // 另有一条未达折叠阈值的待审核举报（演示队列多样性）
  await prisma.report.create({
    data: {
      reporterId: seeker.id,
      targetType: "reply",
      targetId: replies[2].id,
      targetOwnerId: replies[2].authorId,
      reason: "irrelevant",
    },
  });

  const aiSummary = {
    overview:
      "中山大学经济学偏理论训练，课程体系完整，毕业去向以金融、考公、咨询和企业财务为主，珠三角校友资源是明显优势。",
    curriculum_insight:
      "大一以高数、线代、概率论和微观/宏观经济学入门为主；大二开设计量经济学、中级宏观等硬核课程；大三起可按金融、国际金融、产业组织等方向选修。",
    strengths: [
      "综合类大学平台大，转专业和辅修选择多",
      "地处大湾区，金融圈实习机会和校友网络密集",
      "保研率不低，成绩前 20% 左右有机会",
    ],
    weaknesses: [
      "课程偏理论，金融实操技能需要自己补",
      "想进头部券商/投行基本需要研究生学历",
      "金融行业整体内卷，本科直接就业起点偏基础",
    ],
    job_prospect:
      "多数毕业去向为银行、券商、咨询、考公和企业财务；研究生学历或两段以上实习对进好岗位帮助明显。",
    industry_outlook:
      "金融行业竞争加剧，投行和研究岗门槛高；经济学训练对考公、咨询、互联网商业分析仍通用，转型路径较多。",
    advisor_insight:
      "想做学术建议选研究型导师，想就业建议选有产业资源的导师，选导师前先了解课题组毕业去向。",
    advice:
      "大学期间尽早规划实习，大二开始积累；把计量、统计学扎实，对就业和深造都有用；就业信息多问校友。",
    disagreements: ["有回复认为经济学偏‘万金油’，也有回复认为逻辑训练和转型空间是最大价值。"],
    confidence: "high",
    sample_note: "基于 12 条回复，其中 10 条来自认证用户",
  };
  await prisma.aiSummary.create({
    data: {
      questionId: mainQuestion.id,
      summaryJson: JSON.stringify(aiSummary),
      sourceReplyIds: JSON.stringify(replies.map((r) => r.id)),
      version: 1,
      confidence: "high",
      sampleNote: aiSummary.sample_note,
    },
  });

  const aiPost = await prisma.aiPost.create({
    data: {
      authorId: alumni.id,
      questionId: mainQuestion.id,
      title: "中大经济学真实就读体验与就业观察",
      summaryJson: JSON.stringify({
        overview: aiSummary.overview,
        curriculum_insight: aiSummary.curriculum_insight,
        strengths: aiSummary.strengths.slice(0, 2),
        weaknesses: aiSummary.weaknesses.slice(0, 2),
        job_prospect: aiSummary.job_prospect,
        industry_outlook: aiSummary.industry_outlook,
        advisor_insight: aiSummary.advisor_insight,
        advice: aiSummary.advice,
        confidence: "medium",
        sample_note: "用户挑选 8 条回复生成（离线演示模板）",
      }),
      selectedReplyIds: JSON.stringify(replies.slice(0, 8).map((r) => r.id)),
      sourceCount: 8,
      starCount: 6,
      isHumanEdited: true,
      status: "published",
      publishedAt: new Date(),
    },
  });
  await seedStars("ai_post", aiPost.id, 6);

  // v4.4 演示：收藏（收藏是独立的“有用”信号，不计入 star_score）
  await prisma.question.update({ where: { id: mainQuestion.id }, data: { favoriteCount: 4 } });
  await seedFavorites("question", mainQuestion.id, 4);
  await prisma.aiPost.update({ where: { id: aiPost.id }, data: { favoriteCount: 3 } });
  await seedFavorites("ai_post", aiPost.id, 3);
  const replyFavSeeds = [
    { index: 0, count: 3 },
    { index: 1, count: 4 },
    { index: 5, count: 2 },
  ];
  for (const item of replyFavSeeds) {
    const reply = replies[item.index];
    if (reply) {
      await prisma.reply.update({ where: { id: reply.id }, data: { favoriteCount: item.count } });
      await seedFavorites("reply", reply.id, item.count, reply.authorId);
    }
  }

  // v4.4 演示：经验帖 / 避雷帖（轻量内容形态 + 配图字段）
  async function seedExperiencePost(input: {
    authorId: string;
    title: string;
    content: string;
    postType: "experience" | "avoid";
    scenarioType?: string | null;
    schoolId?: string | null;
    majorId?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    images?: string[];
    likeCount: number;
    favoriteCount: number;
  }) {
    const post = await prisma.experiencePost.create({
      data: {
        authorId: input.authorId,
        title: input.title,
        content: input.content,
        postType: input.postType,
        scenarioType: input.scenarioType ?? null,
        schoolId: input.schoolId ?? null,
        majorId: input.majorId ?? null,
        courseId: input.courseId ?? null,
        teacherId: input.teacherId ?? null,
        images: JSON.stringify(input.images ?? []),
        likeCount: input.likeCount,
        favoriteCount: input.favoriteCount,
      },
    });
    await seedStars("experience_post", post.id, input.likeCount, input.authorId);
    await seedFavorites("experience_post", post.id, input.favoriteCount, input.authorId);
    return post;
  }

  await seedExperiencePost({
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
  });

  await seedExperiencePost({
    authorId: student.id,
    title: "避雷：计量经济学选课前，先搞清楚这三件事",
    content:
      "1. 数学要求比想象高，高数线代概率论没学扎实会很吃力；\n2. 建议提前看伍德里奇，光靠听课跟不上；\n3. 小组作业很多，找靠谱队友很重要，别等到期末才组队。\n\n如果有转专业或保研打算，计量成绩很关键，别选在最忙的学期。",
    postType: "avoid",
    scenarioType: "transfer",
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: econometrics.id,
    likeCount: 6,
    favoriteCount: 4,
  });

  await seedExperiencePost({
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
  });

  await seedExperiencePost({
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
  });

  async function seedQuestion(
    title: string,
    description: string,
    scenarioType: string,
    scenarioMeta: Record<string, string>,
    tagNames: string[],
    replyItems: { author: (typeof users)[number]; content: string; stars: number }[]
  ) {
    const question = await prisma.question.create({
      data: {
        title,
        description,
        authorId: seeker.id,
        scenarioType,
        scenarioMeta: JSON.stringify(scenarioMeta),
        replyCount: replyItems.length,
      },
    });
    await linkTags(question.id, tagNames);
    for (const item of replyItems) {
      const reply = await prisma.reply.create({
        data: {
          questionId: question.id,
          authorId: item.author.id,
          content: item.content,
          starCount: item.stars,
        },
      });
      await seedStars("reply", reply.id, item.stars, item.author.id);
    }
    return question;
  }

  await seedQuestion(
    "经济学是不是“万金油”？转专业值得吗？",
    "现在工商管理大一，想转到经济学，不知道课程难度和就业到底怎么样。",
    "transfer",
    { fromMajor: "工商管理", targetMajor: "经济学", grade: "大一" },
    ["经济学", "转专业", "本科"],
    [
      { author: student, content: "转专业一般看大一绩点和笔试面试，经济学对数学要求比想象高，做好高数线代准备。", stars: 5 },
      { author: alumni, content: "值得转，经济学训练比工商管理更抽象但更通用，前提是你愿意啃计量和统计学。", stars: 4 },
      { author: grad, content: "我当年从管理类转来，GPA 前 10% 顺利转过，新专业氛围更卷，但机会也更多。", stars: 3 },
    ]
  );

  await seedQuestion(
    "中山大学经济学保研/考研情况如何？",
    "想了解中大经济学读研的难度、方向和毕业去向。",
    "grad_cn",
    { undergradLevel: "211", track: "保研/统考" },
    ["中山大学", "经济学", "考研保研", "硕士"],
    [
      { author: grad, content: "保研看综合成绩和科研，前 20% 有希望；统考竞争激烈，专业课中级宏微观是重点。", stars: 6 },
      { author: alumni, content: "读研后进券商和总行的比例明显更高，建议大二开始跟老师做助研。", stars: 4 },
      { author: graduate, content: "也有不少保研到清北复交和出国读研的，关键看大三前的绩点和论文。", stars: 3 },
    ]
  );

  await seedQuestion(
    "经济学毕业进金融还是互联网？行业现状怎么样？",
    "经济学本科+硕士，就业城市广州/深圳，纠结金融和互联网方向。",
    "career",
    { major: "经济学", city: "广州/深圳", industry: "金融、互联网" },
    ["经济学", "就业行业", "金融"],
    [
      { author: alumni2, content: "金融起薪高但门槛和强度也高，互联网商业分析/数据分析对经济学背景友好。", stars: 5 },
      { author: graduate, content: "深圳金融科技和产业金融岗位多，广州更多银行和国企，先选行业再选城市。", stars: 4 },
      { author: xmu, content: "身边同学去互联网大厂做运营/产品/商分的不少，经济学逻辑是加分项。", stars: 2 },
    ]
  );

  await seedQuestion(
    "申请中大经济学研究生，导师怎么选？",
    "想读产业经济学方向，之后可能继续读博，求导师推荐和避坑经验。",
    "advisor",
    { teacherName: "王教授", direction: "产业经济学", goal: "读博" },
    ["中山大学", "经济学", "导师选择", "硕士"],
    [
      { author: grad, content: "王教授组会两周一次，带学生认真，产业政策方向发论文机会多，适合读博。", stars: 7 },
      { author: alumni, content: "选导师看三件事：毕业去向、经费资源、push 程度，面试时直接问课题组师兄师姐。", stars: 5 },
      { author: student, content: "想读博选学术型导师，想就业选有产业资源的导师，别只看头衔。", stars: 3 },
    ]
  );

  await seedQuestion(
    "中大和厦大经济学怎么选？",
    "广东考生，分数两个都能上，比较看重就业和实习资源。",
    "gaokao",
    { scoreBand: "省排 6000", subjects: "历史+政治", cityPref: "广东" },
    ["中山大学", "厦门大学", "经济学", "高考志愿"],
    [
      { author: xmu, content: "厦大经济学科沉淀更久，学术氛围浓；中大胜在大湾区和实习便利，看你想就业还是读博。", stars: 4 },
      { author: alumni2, content: "想留广东就业选中大，校友圈和实习资源更近；想走学术可以多看厦大王亚南研究院。", stars: 3 },
    ]
  );

  async function seedReview(input: {
    authorId: string;
    schoolId: string;
    majorId?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    degreeLevel: string;
    enrolledYear?: number | null;
    isAlumni?: boolean;
    ratings: Record<string, unknown>;
    content: string;
  }) {
    await prisma.review.create({
      data: {
        authorId: input.authorId,
        schoolId: input.schoolId,
        majorId: input.majorId ?? null,
        courseId: input.courseId ?? null,
        teacherId: input.teacherId ?? null,
        degreeLevel: input.degreeLevel,
        enrolledYear: input.enrolledYear ?? null,
        isAlumni: input.isAlumni ?? false,
        ratings: JSON.stringify(input.ratings),
        content: input.content,
      },
    });
  }

  // 学校/专业级结构化评价（经济学）
  await seedReview({
    authorId: alumni.id,
    schoolId: sysu.id,
    majorId: economics.id,
    degreeLevel: "bachelor",
    enrolledYear: 2019,
    isAlumni: true,
    ratings: {
      teaching: 4, workload: 4, difficulty: 3, employment: 5, atmosphere: 4,
      outcomes: { furtherStudy: 35, employment: 50, civilService: 15 },
    },
    content: "中大经济学课程偏理论，但珠三角金融就业认可度高，实习和校友资源是最大优势。",
  });
  await seedReview({
    authorId: student.id,
    schoolId: sysu.id,
    majorId: economics.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: {
      teaching: 4, workload: 4, difficulty: 3, employment: 4, atmosphere: 4,
      outcomes: { furtherStudy: 30, employment: 55, civilService: 15 },
    },
    content: "课程压力中等，大二计量比较硬核；同学里很多人在大二就开始找实习。",
  });
  await seedReview({
    authorId: graduate.id,
    schoolId: sysu.id,
    majorId: economics.id,
    degreeLevel: "bachelor",
    enrolledYear: 2020,
    isAlumni: true,
    ratings: {
      teaching: 3, workload: 4, difficulty: 4, employment: 5, atmosphere: 4,
      outcomes: { furtherStudy: 30, employment: 55, civilService: 15 },
    },
    content: "毕业去向主要是银行、券商、咨询和企业财务，硕士学历对进头部岗位帮助明显。",
  });
  await seedReview({
    authorId: grad.id,
    schoolId: sysu.id,
    majorId: economics.id,
    degreeLevel: "master",
    enrolledYear: 2024,
    ratings: {
      teaching: 4, workload: 5, difficulty: 5, employment: 4, atmosphere: 3,
      outcomes: { furtherStudy: 45, employment: 45, civilService: 10 },
    },
    content: "读研阶段更卷，计量和论文是硬门槛；想走学术的同学不少，就业资源也集中在金融圈。",
  });
  await seedReview({
    authorId: xmu.id,
    schoolId: xmuSchool.id,
    majorId: economics.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: {
      teaching: 5, workload: 4, difficulty: 4, employment: 3, atmosphere: 4,
      outcomes: { furtherStudy: 40, employment: 45, civilService: 15 },
    },
    content: "厦大经济学科沉淀深，课程严谨，学术氛围浓；就业上珠三角不如中大便利。",
  });
  await seedReview({
    authorId: xmuAlumni.id,
    schoolId: xmuSchool.id,
    majorId: economics.id,
    degreeLevel: "bachelor",
    enrolledYear: 2020,
    isAlumni: true,
    ratings: {
      teaching: 4, workload: 4, difficulty: 4, employment: 4, atmosphere: 4,
      outcomes: { furtherStudy: 35, employment: 50, civilService: 15 },
    },
    content: "经济学训练扎实，考公和继续深造比例高；就业更多看城市选择和个人实习。",
  });

  // 学校整体就读体验
  await seedReview({
    authorId: sysuSophomore.id,
    schoolId: sysu.id,
    degreeLevel: "bachelor",
    enrolledYear: 2025,
    ratings: {
      teaching: 4, workload: 4, difficulty: 3, employment: 4, atmosphere: 4,
      outcomes: { furtherStudy: 35, employment: 50, civilService: 15 },
    },
    content: "中大校园资源和社团活动丰富，广州校区通勤方便，整体就读体验不错。",
  });
  await seedReview({
    authorId: alumni2.id,
    schoolId: sysu.id,
    degreeLevel: "bachelor",
    enrolledYear: 2018,
    isAlumni: true,
    ratings: {
      teaching: 4, workload: 4, difficulty: 4, employment: 5, atmosphere: 4,
      outcomes: { furtherStudy: 30, employment: 55, civilService: 15 },
    },
    content: "校友网络在广深金融圈密度高，很多岗位信息来自校友内推，就业下限比较高。",
  });

  // 课程评价：中山大学
  await seedReview({
    authorId: student.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: micro.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: { teaching: 4, workload: 4, difficulty: 4, grading: 4, career: 4 },
    content: "老师讲得清楚，作业偏多，案例贴国内现实，对理解经济学很有帮助。",
  });
  await seedReview({
    authorId: alumni2.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: micro.id,
    degreeLevel: "bachelor",
    enrolledYear: 2018,
    isAlumni: true,
    ratings: { teaching: 5, workload: 3, difficulty: 3, grading: 4, career: 5 },
    content: "微观经济学是后面所有专业课的基础，建议认真吃透，就业面试也常被问到。",
  });
  await seedReview({
    authorId: graduate.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: micro.id,
    degreeLevel: "bachelor",
    enrolledYear: 2020,
    isAlumni: true,
    ratings: { teaching: 4, workload: 4, difficulty: 4, grading: 4, career: 4 },
    content: "教材和习题比较经典，期中期末都看得出平时积累，临时抱佛脚不太行。",
  });
  await seedReview({
    authorId: alumni.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: micro.id,
    degreeLevel: "bachelor",
    enrolledYear: 2019,
    isAlumni: true,
    ratings: { teaching: 4, workload: 4, difficulty: 3, grading: 5, career: 5 },
    content: "给分相对友好，认真完成作业就能拿高分；学完之后看商业新闻会更有感觉。",
  });
  await seedReview({
    authorId: student.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: macro.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: { teaching: 4, workload: 3, difficulty: 3, grading: 4, career: 4 },
    content: "宏观经济学比微观更偏政策叙事，老师会结合当下经济形势讲，课堂不枯燥。",
  });
  await seedReview({
    authorId: grad.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: macro.id,
    degreeLevel: "master",
    enrolledYear: 2024,
    ratings: { teaching: 5, workload: 4, difficulty: 4, grading: 4, career: 4 },
    content: "中级宏观要求模型推导，有一定门槛；对考公和申研都有帮助。",
  });
  await seedReview({
    authorId: alumni.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: macro.id,
    degreeLevel: "bachelor",
    enrolledYear: 2019,
    isAlumni: true,
    ratings: { teaching: 4, workload: 4, difficulty: 3, grading: 4, career: 4 },
    content: "宏观框架对理解利率、汇率和行业周期很实用，工作后还经常回头翻笔记。",
  });
  await seedReview({
    authorId: grad.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: econometrics.id,
    degreeLevel: "master",
    enrolledYear: 2024,
    ratings: { teaching: 5, workload: 5, difficulty: 5, grading: 3, career: 4 },
    content: "计量经济学是硬课，作业和上机都很重，但学会了数据分析能力提升很大。",
  });
  await seedReview({
    authorId: alumni.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: econometrics.id,
    degreeLevel: "bachelor",
    enrolledYear: 2019,
    isAlumni: true,
    ratings: { teaching: 4, workload: 4, difficulty: 4, grading: 3, career: 5 },
    content: "建议提前自学伍德里奇，多跑实证；这段训练对券商研究和互联网商分都加分。",
  });
  await seedReview({
    authorId: sysuSophomore.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: econometrics.id,
    degreeLevel: "bachelor",
    enrolledYear: 2025,
    ratings: { teaching: 4, workload: 4, difficulty: 4, grading: 3, career: 4 },
    content: "课程安排紧凑，小组作业多，比较锻炼人；给分不算宽松。",
  });
  await seedReview({
    authorId: sysuSophomore.id,
    schoolId: sysu.id,
    majorId: finance.id,
    courseId: financeCourse.id,
    degreeLevel: "bachelor",
    enrolledYear: 2025,
    ratings: { teaching: 4, workload: 3, difficulty: 3, grading: 4, career: 5 },
    content: "金融学入门课，内容贴近市场，老师会讲很多真实案例，对找实习有启发。",
  });
  await seedReview({
    authorId: alumni2.id,
    schoolId: sysu.id,
    majorId: finance.id,
    courseId: financeCourse.id,
    degreeLevel: "bachelor",
    enrolledYear: 2018,
    isAlumni: true,
    ratings: { teaching: 4, workload: 4, difficulty: 3, grading: 4, career: 5 },
    content: "作为金融方向入门很合适，想进券商建议同时补财报分析和估值建模。",
  });
  await seedReview({
    authorId: sysuSophomore.id,
    schoolId: sysu.id,
    majorId: finance.id,
    courseId: intlFinance.id,
    degreeLevel: "bachelor",
    enrolledYear: 2025,
    ratings: { teaching: 5, workload: 3, difficulty: 3, grading: 4, career: 4 },
    content: "国际金融课堂讨论多，汇率和跨境资本流动讲得清楚，案例比较新。",
  });
  await seedReview({
    authorId: student.id,
    schoolId: sysu.id,
    majorId: finance.id,
    courseId: intlFinance.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: { teaching: 4, workload: 3, difficulty: 3, grading: 4, career: 4 },
    content: "课程不水但也不压分，认真看新闻就能跟上课堂节奏。",
  });
  await seedReview({
    authorId: grad.id,
    schoolId: sysu.id,
    majorId: economics.id,
    courseId: industryEco.id,
    degreeLevel: "master",
    enrolledYear: 2024,
    ratings: { teaching: 4, workload: 4, difficulty: 4, grading: 4, career: 4 },
    content: "产业经济学和导师研究方向衔接好，适合对政策研究感兴趣的同学。",
  });

  // 课程评价：厦门大学
  await seedReview({
    authorId: xmu.id,
    schoolId: xmuSchool.id,
    majorId: economics.id,
    courseId: xmuMicro.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: { teaching: 5, workload: 4, difficulty: 4, grading: 4, career: 4 },
    content: "中级微观讲得很细，推导要求高，认真跟下来数学和经济学直觉都会变好。",
  });
  await seedReview({
    authorId: xmuAlumni.id,
    schoolId: xmuSchool.id,
    majorId: economics.id,
    courseId: xmuMicro.id,
    degreeLevel: "bachelor",
    enrolledYear: 2020,
    isAlumni: true,
    ratings: { teaching: 4, workload: 4, difficulty: 4, grading: 4, career: 4 },
    content: "课程质量扎实，教材和习题体系完整，适合想继续读研的同学。",
  });
  await seedReview({
    authorId: xmu.id,
    schoolId: xmuSchool.id,
    majorId: economics.id,
    courseId: xmuEconometrics.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: { teaching: 5, workload: 5, difficulty: 5, grading: 3, career: 4 },
    content: "计量课是厦大经济系出了名的硬课，上机作业多，但收获也大。",
  });
  await seedReview({
    authorId: xmuAlumni.id,
    schoolId: xmuSchool.id,
    majorId: economics.id,
    courseId: xmuEconometrics.id,
    degreeLevel: "bachelor",
    enrolledYear: 2020,
    isAlumni: true,
    ratings: { teaching: 4, workload: 4, difficulty: 4, grading: 3, career: 4 },
    content: "认真学完基本实证方法都能上手，考研复试和实习笔试都常用到。",
  });
  await seedReview({
    authorId: xmu.id,
    schoolId: xmuSchool.id,
    majorId: finance.id,
    courseId: xmuFinance.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: { teaching: 4, workload: 3, difficulty: 3, grading: 4, career: 5 },
    content: "金融学入门案例多，能建立起对资本市场的初步框架。",
  });
  await seedReview({
    authorId: xmuAlumni.id,
    schoolId: xmuSchool.id,
    majorId: finance.id,
    courseId: xmuFinance.id,
    degreeLevel: "bachelor",
    enrolledYear: 2020,
    isAlumni: true,
    ratings: { teaching: 4, workload: 3, difficulty: 3, grading: 4, career: 4 },
    content: "中规中矩的入门课，想往金融走建议课外多补估值和财务建模。",
  });

  // 导师/教师评价：中山大学
  await seedReview({
    authorId: grad.id,
    schoolId: sysu.id,
    teacherId: teacher.id,
    degreeLevel: "master",
    enrolledYear: 2024,
    ratings: { guidance: 4, push: 3, atmosphere: 4, career: 4, resources: 4 },
    content: "组会两周一次，研究方向偏产业政策，毕业去向有券商也有继续读博的。",
  });
  await seedReview({
    authorId: student.id,
    schoolId: sysu.id,
    teacherId: teacher.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: { teaching: 4, patience: 4, grading: 4, guidance: 4, push: 3, atmosphere: 4, career: 4, resources: 4 },
    content: "王教授讲课清楚，答疑耐心，产业政策方向的案例很接地气。",
  });
  await seedReview({
    authorId: alumni.id,
    schoolId: sysu.id,
    teacherId: teacher.id,
    degreeLevel: "bachelor",
    enrolledYear: 2019,
    isAlumni: true,
    ratings: { teaching: 4, patience: 4, grading: 4, guidance: 5, push: 4, atmosphere: 4, career: 5, resources: 5 },
    content: "毕业去向和行业资源都不错，想走产业政策和金融研究的同学可以重点关注。",
  });
  await seedReview({
    authorId: sysuSophomore.id,
    schoolId: sysu.id,
    teacherId: zhang.id,
    degreeLevel: "bachelor",
    enrolledYear: 2025,
    ratings: { teaching: 4, patience: 5, grading: 5, guidance: 3, push: 2, atmosphere: 4, career: 3, resources: 3 },
    content: "张老师答疑非常耐心，给分友好，适合想稳扎稳打把基础打牢的同学。",
  });
  await seedReview({
    authorId: alumni2.id,
    schoolId: sysu.id,
    teacherId: zhang.id,
    degreeLevel: "bachelor",
    enrolledYear: 2018,
    isAlumni: true,
    ratings: { teaching: 4, patience: 4, grading: 5, guidance: 3, push: 2, atmosphere: 3, career: 3, resources: 3 },
    content: "老师人很温和，作业量适中；如果目标是就业，还是要自己主动找实习。",
  });
  await seedReview({
    authorId: grad.id,
    schoolId: sysu.id,
    teacherId: chen.id,
    degreeLevel: "master",
    enrolledYear: 2024,
    ratings: { teaching: 5, patience: 4, grading: 4, guidance: 5, push: 4, atmosphere: 5, career: 5, resources: 5 },
    content: "陈教授课题组学术资源丰富，组会讨论质量高，适合有读博意向的同学。",
  });

  // 导师/教师评价：厦门大学
  await seedReview({
    authorId: xmu.id,
    schoolId: xmuSchool.id,
    teacherId: li.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: { teaching: 5, patience: 5, grading: 4, guidance: 4, push: 3, atmosphere: 5, career: 4, resources: 5 },
    content: "李教授学术水平高，对学生耐心，王亚南研究院的讲座和资料资源很丰富。",
  });
  await seedReview({
    authorId: xmuAlumni.id,
    schoolId: xmuSchool.id,
    teacherId: li.id,
    degreeLevel: "bachelor",
    enrolledYear: 2020,
    isAlumni: true,
    ratings: { teaching: 4, patience: 5, grading: 4, guidance: 4, push: 3, atmosphere: 4, career: 4, resources: 4 },
    content: "适合想做学术的同学，导师会认真改论文；想直接就业的话自由度也比较高。",
  });
  await seedReview({
    authorId: xmu.id,
    schoolId: xmuSchool.id,
    teacherId: zhao.id,
    degreeLevel: "bachelor",
    enrolledYear: 2023,
    ratings: { teaching: 4, patience: 4, grading: 5, guidance: 3, push: 2, atmosphere: 4, career: 3, resources: 3 },
    content: "赵老师讲课和给分都不错，课题压力小，适合本科阶段打基础。",
  });

  // 按公式重算所有用户 star_score 与等级，保证与演示数据一致。
  for (const user of users) {
    const questionIds = (
      await prisma.question.findMany({ where: { authorId: user.id }, select: { id: true } })
    ).map((q) => q.id);
    const replyIds = (
      await prisma.reply.findMany({ where: { authorId: user.id }, select: { id: true } })
    ).map((r) => r.id);
    const postIds = (
      await prisma.aiPost.findMany({ where: { authorId: user.id }, select: { id: true } })
    ).map((p) => p.id);

    const violationRows = await prisma.report.findMany({
      where: { targetOwnerId: user.id, status: "resolved", isValid: true },
      select: { targetType: true, targetId: true },
    });
    const violations = new Set(violationRows.map((row) => `${row.targetType}:${row.targetId}`)).size;
    const [questionStars, replyStars, postStars, accepted, validReports, falseReports] = await Promise.all([
      questionIds.length
        ? prisma.contentStar.count({ where: { targetType: "question", targetId: { in: questionIds } } })
        : 0,
      replyIds.length ? prisma.contentStar.count({ where: { targetType: "reply", targetId: { in: replyIds } } }) : 0,
      postIds.length ? prisma.contentStar.count({ where: { targetType: "ai_post", targetId: { in: postIds } } }) : 0,
      prisma.reply.count({ where: { authorId: user.id, isAccepted: true } }),
      prisma.report.count({ where: { reporterId: user.id, status: "resolved", isValid: true, rewardApplied: true } }),
      prisma.report.count({ where: { reporterId: user.id, status: "dismissed", isValid: false } }),
    ]);
    const verified = (JSON.parse(user.verifiedSchools) as string[]).length;
    const score =
      questionStars * 1 +
      replyStars * 2 +
      postStars * 5 +
      accepted * 10 +
      verified * 20 +
      validReports * 5 +
      falseReports * -10 +
      violations * -20;
    const level = score >= 800 ? 4 : score >= 300 ? 3 : score >= 100 ? 2 : score >= 30 ? 1 : 0;
    await prisma.user.update({ where: { id: user.id }, data: { starScore: score, level } });
  }

  // 推荐画像种子（演示：seeker 高考生 + 中大经济学）
  const seekerIdentity = {
    "scenario:gaokao": 1.2,
    "school:中山大学": 1.5,
    "major:经济学": 1.5,
    "region:广东": 0.8,
  };
  await prisma.userProfile.upsert({
    where: { userId: seeker.id },
    create: { userId: seeker.id, tagVector: JSON.stringify(seekerIdentity) },
    update: { tagVector: JSON.stringify(seekerIdentity) },
  });

  // 社交演示：seeker 与 alumni 互相关注，并有一条可畅聊的会话
  await prisma.follow.createMany({
    data: [
      { followerId: seeker.id, followingId: alumni.id },
      { followerId: alumni.id, followingId: seeker.id },
    ],
  });
  const [convA, convB] = [seeker.id, alumni.id].sort();
  const demoConv = await prisma.conversation.create({
    data: { userAId: convA, userBId: convB },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: demoConv.id, senderId: seeker.id, content: "学长你好！想请教下中大经济学的就业情况，方便吗？" },
      { conversationId: demoConv.id, senderId: alumni.id, content: "你好！可以呀，你想了解哪个方向？", readAt: new Date() },
    ],
  });

  console.log("seed done");
  console.log("提问账号: seeker@demo.uni / Test1234!");
  console.log("回答账号: alumni@demo.uni / Test1234!");
  console.log("管理员账号: admin@demo.uni / Test1234!（可访问 /admin 审核队列）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
