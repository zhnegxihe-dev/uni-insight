const fs = require("fs");
const path = "D:/星程/uni-insight/static-demo/src/data/seed.json";
const seed = JSON.parse(fs.readFileSync(path, "utf8"));
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// 1) 诚信分演示：中大经济学长 trustScore 25（展示「透明分享者」徽章）
const alumni = seed.users.find((u) => u.nickname === "中大经济学长");
if (alumni) alumni.trustScore = 25;

// 2) 推广池演示帖
const student = seed.users.find((u) => u.nickname === "中大在读学姐");
const sysu = seed.schools.find((s) => s.name === "中山大学");
if (student && sysu && !seed.experiencePosts.some((p) => p.postType === "promo")) {
  seed.experiencePosts.unshift({
    id: uid("p"),
    authorId: student.id,
    title: "南门巷子口的沙县小吃，晚自习后的快乐老家",
    content: "学校南门巷子口那家沙县小吃，拌面和蒸饺都挺稳，老板给的量很实在，晚自习下课来一份刚刚好。老板人很热情，说学生党来吃还给打折。\n\n（本条为商家委托推广，已明示标注；好不好吃评论区说了算）",
    postType: "promo",
    scenarioType: null,
    schoolId: sysu.id,
    majorId: null,
    courseId: null,
    teacherId: null,
    merchantName: "南门沙县小吃",
    images: "[]",
    likeCount: 3,
    favoriteCount: 1,
    status: "visible",
    createdAt: "2026-08-28T10:00:00.000Z",
  });
}

fs.writeFileSync(path, JSON.stringify(seed, null, 2), "utf8");
console.log("seed.json 演示数据更新完成: promo=" + seed.experiencePosts.filter((p) => p.postType === "promo").length + ", alumni.trustScore=" + (alumni?.trustScore ?? "无"));