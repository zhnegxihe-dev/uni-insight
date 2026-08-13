import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();

await client.query(`
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "nickname" TEXT NOT NULL,
  "bio" TEXT,
  "avatarUrl" TEXT,
  "starScore" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 0,
  "verifiedSchools" TEXT NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "School" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "region" TEXT,
  "type" TEXT,
  "description" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS "School_slug_key" ON "School"("slug");

CREATE TABLE IF NOT EXISTS "Major" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "Major_slug_key" ON "Major"("slug");

CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "schoolId" TEXT NOT NULL,
  "majorId" TEXT,
  "name" TEXT NOT NULL,
  "code" TEXT,
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Course_schoolId_code_key" ON "Course"("schoolId", "code");

CREATE TABLE IF NOT EXISTS "Teacher" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "schoolId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "department" TEXT,
  "title" TEXT,
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Question" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "authorId" TEXT NOT NULL,
  "scenarioType" TEXT NOT NULL,
  "scenarioMeta" TEXT NOT NULL DEFAULT '{}',
  "degreeLevel" TEXT,
  "replyCount" INTEGER NOT NULL DEFAULT 0,
  "starCount" INTEGER NOT NULL DEFAULT 0,
  "acceptedReplyId" TEXT,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Question_authorId_idx" ON "Question"("authorId");
CREATE INDEX IF NOT EXISTS "Question_scenarioType_idx" ON "Question"("scenarioType");

CREATE TABLE IF NOT EXISTS "Reply" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "questionId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "starCount" INTEGER NOT NULL DEFAULT 0,
  "isAccepted" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'visible',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Reply_questionId_idx" ON "Reply"("questionId");
CREATE INDEX IF NOT EXISTS "Reply_authorId_idx" ON "Reply"("authorId");

CREATE TABLE IF NOT EXISTS "ContentStar" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "weight" REAL NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContentStar_userId_targetType_targetId_key" ON "ContentStar"("userId", "targetType", "targetId");
CREATE INDEX IF NOT EXISTS "ContentStar_target_idx" ON "ContentStar"("targetType", "targetId");

CREATE TABLE IF NOT EXISTS "Tag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug");

CREATE TABLE IF NOT EXISTS "QuestionTag" (
  "questionId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("questionId", "tagId"),
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "authorId" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "majorId" TEXT,
  "courseId" TEXT,
  "teacherId" TEXT,
  "degreeLevel" TEXT,
  "enrolledYear" INTEGER,
  "isAlumni" BOOLEAN NOT NULL DEFAULT false,
  "ratings" TEXT NOT NULL DEFAULT '{}',
  "content" TEXT,
  "status" TEXT NOT NULL DEFAULT 'visible',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Review_schoolId_idx" ON "Review"("schoolId");
CREATE INDEX IF NOT EXISTS "Review_courseId_idx" ON "Review"("courseId");
CREATE INDEX IF NOT EXISTS "Review_teacherId_idx" ON "Review"("teacherId");

CREATE TABLE IF NOT EXISTS "AiSummary" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "questionId" TEXT NOT NULL,
  "summaryJson" TEXT NOT NULL,
  "sourceReplyIds" TEXT NOT NULL DEFAULT '[]',
  "version" INTEGER NOT NULL DEFAULT 1,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "confidence" TEXT,
  "sampleNote" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AiSummary_questionId_key" ON "AiSummary"("questionId");

CREATE TABLE IF NOT EXISTS "AiPost" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "authorId" TEXT NOT NULL,
  "questionId" TEXT,
  "title" TEXT NOT NULL,
  "summaryJson" TEXT NOT NULL,
  "selectedReplyIds" TEXT NOT NULL DEFAULT '[]',
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "starCount" INTEGER NOT NULL DEFAULT 0,
  "isHumanEdited" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'published',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMPTZ,
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AiPost_authorId_idx" ON "AiPost"("authorId");
CREATE INDEX IF NOT EXISTS "AiPost_questionId_idx" ON "AiPost"("questionId");
`);

await client.end();
console.log("PostgreSQL schema initialized");
