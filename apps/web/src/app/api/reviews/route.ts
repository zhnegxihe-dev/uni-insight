import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { RATING_KEYS_BY_TARGET, reviewTargetOf } from "@/lib/reviews";
import { checkContentForUser, moderationErrorMessage } from "@/lib/moderation";

const MAX_CONTENT = 500;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const schoolId = String(body.schoolId ?? "").trim();
  const majorId = body.majorId ? String(body.majorId).trim() : null;
  const courseId = body.courseId ? String(body.courseId).trim() : null;
  const teacherId = body.teacherId ? String(body.teacherId).trim() : null;
  const content = String(body.content ?? "").trim().slice(0, MAX_CONTENT);
  const degreeLevel = String(body.degreeLevel ?? "bachelor");
  const enrolledYear = body.enrolledYear ? Number(body.enrolledYear) : null;
  const isAlumni = Boolean(body.isAlumni);
  const ratingsRaw = body.ratings && typeof body.ratings === "object" ? body.ratings : {};

  if (!schoolId) return NextResponse.json({ error: "缺少学校信息" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "请填写评价内容" }, { status: 400 });

  // 广告词库 + 正则拦截
  const check = checkContentForUser(content, user.level);
  if (!check.ok) {
    return NextResponse.json({ error: moderationErrorMessage(check) }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) return NextResponse.json({ error: "学校不存在" }, { status: 404 });
  if (!user.verifiedSchools.includes(school.name)) {
    return NextResponse.json(
      { error: "只有通过该校邮箱认证的用户可以发表结构化评价" },
      { status: 403 }
    );
  }

  const target = reviewTargetOf({ courseId, teacherId, majorId });
  const allowedKeys = RATING_KEYS_BY_TARGET[target];
  const ratings: Record<string, number> = {};
  for (const key of allowedKeys) {
    const value = Number(ratingsRaw[key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json({ error: `评分 ${key} 必须是 1-5 的整数` }, { status: 400 });
    }
    ratings[key] = value;
  }

  if (majorId) {
    const major = await prisma.major.findUnique({ where: { id: majorId } });
    if (!major) return NextResponse.json({ error: "专业不存在" }, { status: 404 });
  }
  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.schoolId !== schoolId) {
      return NextResponse.json({ error: "课程不存在或不属于该学校" }, { status: 404 });
    }
  }
  if (teacherId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json({ error: "教师不存在或不属于该学校" }, { status: 404 });
    }
  }

  const review = await prisma.review.create({
    data: {
      authorId: user.id,
      schoolId,
      majorId,
      courseId,
      teacherId,
      degreeLevel,
      enrolledYear,
      isAlumni,
      ratings: JSON.stringify(ratings),
      content,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: review.id });
}
