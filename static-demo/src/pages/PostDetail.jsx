import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { LikeButton, FavoriteButton, VerifiedBadge, ImageGallery } from "../components";

export default function PostDetail() {
  const { id } = useParams();
  const state = useDb();
  const post = db.getExperiencePost(state, id);

  if (!post) {
    return <div className="card p-10 text-center text-sm text-zinc-400">帖子不存在</div>;
  }
  if (post.status === "hidden") {
    return <div className="card p-10 text-center text-sm text-zinc-400">该帖因被确认违规已被隐藏</div>;
  }

  const typeMeta = db.POST_TYPES.find((p) => p.key === post.postType);
  const isAvoid = post.postType === "avoid";
  const schools = JSON.parse(post.author?.verifiedSchools || "[]");
  const scenarioLabel = post.scenarioType ? (db.SCENARIO_LABEL[post.scenarioType] ?? post.scenarioType) : null;
  let images = [];
  try { images = JSON.parse(post.images || "[]"); } catch { images = []; }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/posts" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" />返回经验帖
      </Link>

      {post.status === "folded" && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />该帖因多次举报已被折叠，正在人工审核中。
        </div>
      )}

      <section className="card p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${isAvoid ? "bg-red-50 text-red-600" : "bg-blue-50 text-accent"}`}>
            {typeMeta?.label ?? post.postType}
          </span>
          {scenarioLabel && <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-600">{scenarioLabel}</span>}
        </div>
        <h1 className="text-lg font-semibold leading-snug text-ink">{post.title}</h1>

        {(post.school || post.major || post.course || post.teacher) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
            {post.school && <Link to={`/school/${post.school.slug}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 hover:bg-blue-50 hover:text-accent">学校：{post.school.name}</Link>}
            {post.major && <Link to={`/major/${post.major.slug}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 hover:bg-blue-50 hover:text-accent">专业：{post.major.name}</Link>}
            {post.course && <Link to={`/course/${post.course.id}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 hover:bg-blue-50 hover:text-accent">课程：{post.course.name}</Link>}
            {post.teacher && <Link to={`/teacher/${post.teacher.id}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-zinc-600 hover:bg-blue-50 hover:text-accent">教师：{post.teacher.name}</Link>}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
          <Link to={`/user/${post.author?.id}`} className="font-medium text-zinc-600 hover:text-accent">{post.author?.nickname}</Link>
          <VerifiedBadge schools={schools} />
          <span>L{post.author?.level}</span>
          <span>{db.formatRelative(post.createdAt)}</span>
        </div>

        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{post.content}</div>

        <ImageGallery images={images} />

        <div className="mt-5 flex items-center gap-2 border-t border-line pt-3">
          <LikeButton targetType="experience_post" targetId={post.id} label="这篇经验有帮助" />
          <FavoriteButton targetType="experience_post" targetId={post.id} label="收藏这篇经验帖" />
        </div>
      </section>
    </div>
  );
}