import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Test1234!";
const passwordHash = bcrypt.hashSync(PASSWORD, 10);

async function clean() {
  await prisma.contentStar.deleteMany();
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
        email: "seeker@demo.uni",
        passwordHash,
        nickname: "高三考生小星",
        bio: "高考出分，正在研究志愿填报。",
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
  ]);

  const [seeker, alumni, student, grad, graduate, xmu, alumni2] = users;

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

  const economics = await prisma.major.create({
    data: { name: "经济学", slug: "economics", category: "经济学类" },
  });
  const cs = await prisma.major.create({
    data: { name: "计算机科学与技术", slug: "computer-science", category: "计算机类" },
  });

  const micro = await prisma.course.create({
    data: { schoolId: sysu.id, majorId: economics.id, name: "微观经济学", code: "ECON101" },
  });
  await prisma.course.create({
    data: { schoolId: sysu.id, majorId: economics.id, name: "宏观经济学", code: "ECON102" },
  });
  await prisma.course.create({
    data: { schoolId: sysu.id, majorId: economics.id, name: "计量经济学", code: "ECON210" },
  });
  await prisma.course.create({
    data: { schoolId: xmuSchool.id, majorId: economics.id, name: "中级微观经济学", code: "ECON301" },
  });

  const teacher = await prisma.teacher.create({
    data: {
      schoolId: sysu.id,
      name: "王教授",
      department: "经济学院",
      title: "教授",
    },
  });

  const tags: Record<string, string> = {};
  const tagDefs = [
    ["中山大学", "school"],
    ["厦门大学", "school"],
    ["经济学", "major"],
    ["计算机", "major"],
    ["本科", "degree"],
    ["硕士", "degree"],
    ["高考志愿", "scenario"],
    ["转专业", "scenario"],
    ["考研保研", "scenario"],
    ["申研留学", "scenario"],
    ["导师选择", "scenario"],
    ["就业行业", "scenario"],
    ["广东", "region"],
    ["金融", "industry"],
  ] as const;
  for (const [name, type] of tagDefs) {
    const tag = await prisma.tag.create({
      data: { name, slug: `tag-${name}`, type },
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
      scenarioMeta: JSON.stringify({ scoreBand: "600 分 / 省排 8000", subjects: "物理+化学+生物", cityPref: "广东" }),
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

  async function seedStars(targetType: "question" | "reply" | "ai_post", targetId: string, count: number, excludeUserId?: string) {
    const pool = users.filter((u) => u.id !== excludeUserId);
    const rows = pool.slice(0, Math.min(count, pool.length)).map((user) => ({
      userId: user.id,
      targetType,
      targetId,
    }));
    await prisma.contentStar.createMany({ data: rows });
  }

  await seedStars("question", mainQuestion.id, 5);
  for (const reply of replies) {
    const seed = replySeed.find((r) => r.content === reply.content);
    if (seed) {
      await seedStars("reply", reply.id, seed.stars, seed.author.id);
    }
  }

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

  await prisma.review.create({
    data: {
      authorId: student.id,
      schoolId: sysu.id,
      majorId: economics.id,
      courseId: micro.id,
      degreeLevel: "bachelor",
      enrolledYear: 2023,
      ratings: JSON.stringify({ teaching: 4, workload: 4, difficulty: 4, grading: 4, career: 4 }),
      content: "老师讲得清楚，作业偏多，案例贴国内现实，对理解经济学很有帮助。",
    },
  });
  await prisma.review.create({
    data: {
      authorId: grad.id,
      schoolId: sysu.id,
      teacherId: teacher.id,
      degreeLevel: "master",
      enrolledYear: 2024,
      ratings: JSON.stringify({ guidance: 4, push: 3, atmosphere: 4, career: 4, resources: 4 }),
      content: "组会两周一次，研究方向偏产业政策，毕业去向有券商也有继续读博的。",
    },
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

    const [questionStars, replyStars, postStars, accepted] = await Promise.all([
      questionIds.length
        ? prisma.contentStar.count({ where: { targetType: "question", targetId: { in: questionIds } } })
        : 0,
      replyIds.length ? prisma.contentStar.count({ where: { targetType: "reply", targetId: { in: replyIds } } }) : 0,
      postIds.length ? prisma.contentStar.count({ where: { targetType: "ai_post", targetId: { in: postIds } } }) : 0,
      prisma.reply.count({ where: { authorId: user.id, isAccepted: true } }),
    ]);
    const verified = (JSON.parse(user.verifiedSchools) as string[]).length;
    const score = questionStars * 1 + replyStars * 2 + postStars * 5 + accepted * 10 + verified * 20;
    const level = score >= 800 ? 4 : score >= 300 ? 3 : score >= 100 ? 2 : score >= 30 ? 1 : 0;
    await prisma.user.update({ where: { id: user.id }, data: { starScore: score, level } });
  }

  console.log("seed done");
  console.log("提问账号: seeker@demo.uni / Test1234!");
  console.log("回答账号: alumni@demo.uni / Test1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
