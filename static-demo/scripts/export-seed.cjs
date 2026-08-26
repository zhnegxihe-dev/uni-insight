const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const [users, schools, majors, courses, teachers, tags, questions, replies, questionTags, reviews, aiSummaries, aiPosts] =
    await Promise.all([
      p.user.findMany({ select: { id: true, nickname: true, bio: true, verifiedSchools: true, level: true, starScore: true, createdAt: true } }),
      p.school.findMany({ select: { id: true, name: true, slug: true, region: true, type: true, description: true, verified: true } }),
      p.major.findMany({ select: { id: true, name: true, slug: true, category: true } }),
      p.course.findMany({ select: { id: true, schoolId: true, majorId: true, name: true, code: true } }),
      p.teacher.findMany({ select: { id: true, schoolId: true, name: true, department: true, title: true } }),
      p.tag.findMany({ select: { id: true, name: true, slug: true, type: true } }),
      p.question.findMany({ select: { id: true, title: true, description: true, authorId: true, scenarioType: true, scenarioMeta: true, degreeLevel: true, replyCount: true, starCount: true, acceptedReplyId: true, status: true, createdAt: true } }),
      p.reply.findMany({ select: { id: true, questionId: true, authorId: true, content: true, starCount: true, isAccepted: true, status: true, createdAt: true } }),
      p.questionTag.findMany({ select: { questionId: true, tagId: true } }),
      p.review.findMany({ select: { id: true, authorId: true, schoolId: true, majorId: true, courseId: true, teacherId: true, degreeLevel: true, enrolledYear: true, isAlumni: true, ratings: true, content: true, status: true, createdAt: true } }),
      p.aiSummary.findMany({ select: { questionId: true, summaryJson: true, confidence: true, sampleNote: true } }),
      p.aiPost.findMany({ select: { id: true, authorId: true, questionId: true, title: true, summaryJson: true, selectedReplyIds: true, sourceCount: true, starCount: true, status: true, createdAt: true } }),
    ]);

  const seed = {
    exportedAt: new Date().toISOString(),
    users,
    schools,
    majors,
    courses,
    teachers,
    tags,
    questions,
    replies,
    questionTags,
    reviews,
    aiSummaries,
    aiPosts,
  };

  const out = path.resolve(__dirname, "../src/data/seed.json");
  fs.writeFileSync(out, JSON.stringify(seed), "utf8");
  console.log("seed.json exported:", out);
  console.log("users:", users.length, "schools:", schools.length, "questions:", questions.length, "replies:", replies.length);
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
