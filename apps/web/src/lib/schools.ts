import { prisma } from "./prisma";

export interface SchoolStats {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  type: string | null;
  verified: boolean;
  reviewCount: number;
  majorCount: number;
  teacherCount: number;
  questionCount: number;
}

/** 聚合所有学校的档案统计（认证评价数 / 专业数 / 教师数 / 相关提问数） */
export async function getSchoolsWithStats(limit = 200): Promise<SchoolStats[]> {
  const schools = await prisma.school.findMany({
    include: {
      reviews: { select: { id: true } },
      courses: { select: { majorId: true } },
      teachers: { select: { id: true } },
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  const rows = await Promise.all(
    schools.map(async (school) => {
      const majorCount = new Set(school.courses.map((c) => c.majorId).filter(Boolean)).size;
      const questionCount = await prisma.question.count({
        where: {
          status: { not: "hidden" },
          tags: { some: { tag: { name: school.name, type: "school" } } },
        },
      });
      return {
        id: school.id,
        name: school.name,
        slug: school.slug,
        region: school.region,
        type: school.type,
        verified: school.verified,
        reviewCount: school.reviews.length,
        majorCount,
        teacherCount: school.teachers.length,
        questionCount,
      };
    })
  );

  return rows;
}