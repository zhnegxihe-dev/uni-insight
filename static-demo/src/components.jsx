import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Bookmark, Heart, MessageSquare, ShieldAlert, Sparkles, Star } from "lucide-react";
import { useDb, act } from "./store";
import * as db from "./db";

export function VerifiedBadge({ schools }) {
  if (!schools || schools.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-accent" title="学校邮箱已认证">
      <BadgeCheck className="h-3.5 w-3.5" />
      {schools[0]} · 认证
    </span>
  );
}

export function QuestionCard({ question, folded }) {
  const state = useDb();
  const author = state.users.find((u) => u.id === question.authorId);
  const schools = JSON.parse(author?.verifiedSchools || "[]");
  const tags = state.questionTags
    .filter((qt) => qt.questionId === question.id)
    .map((qt) => state.tags.find((t) => t.id === qt.tagId))
    .filter(Boolean)
    .slice(0, 4);
  return (
    <div className="card block p-5 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-accent">
          {db.SCENARIO_LABEL[question.scenarioType] ?? question.scenarioType}
        </span>
        {folded && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <ShieldAlert className="h-3.5 w-3.5" />已折叠
          </span>
        )}
      </div>
      <Link to={`/question/${question.id}`} className="text-[15px] font-semibold leading-snug text-ink hover:text-accent">
        {question.title}
      </Link>
      {question.description && <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{question.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => {
          const href =
            tag.type === "school"
              ? `/school/${tag.slug}`
              : tag.type === "major"
                ? `/major/${tag.slug}`
                : `/search?q=${encodeURIComponent(tag.name)}`;
          return (
            <Link key={tag.id} to={href} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 transition hover:bg-blue-50 hover:text-accent">
              {tag.name}
            </Link>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1" title="点赞数">
          <Heart className={`h-3.5 w-3.5 ${db.starCountFor(state, "question", question.id) > 0 ? "fill-rose-400 text-rose-400" : "text-zinc-400"}`} />
          {db.starCountFor(state, "question", question.id)}
        </span>
        <span className="inline-flex items-center gap-1" title="收藏数">
          <Bookmark className={`h-3.5 w-3.5 ${db.favoriteCountFor(state, "question", question.id) > 0 ? "fill-blue-400 text-blue-400" : "text-zinc-400"}`} />
          {db.favoriteCountFor(state, "question", question.id)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
          {question.replyCount}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Link to={`/user/${author?.id}`} className="font-medium text-zinc-600 hover:text-accent">{author?.nickname}</Link>
          <VerifiedBadge schools={schools} />
        </span>
        <span>{db.formatRelative(question.createdAt)}</span>
      </div>
    </div>
  );
}

export function LikeButton({ targetType, targetId, label }) {
  const state = useDb();
  const user = db.getCurrentUser(state);
  const active = db.isStarred(state, targetType, targetId);
  const count = db.starCountFor(state, targetType, targetId);
  return (
    <button
      type="button"
      onClick={() => {
        if (!user) { alert("请先登录"); return; }
        try {
          act(db.toggleStar, targetType, targetId);
        } catch (e) {
          alert(e.message);
        }
      }}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-all active:scale-90 ${
        active ? "bg-rose-50 text-rose-600" : "text-zinc-500 hover:bg-zinc-50 hover:text-ink"
      }`}
      title={label ?? "点赞"}
      aria-pressed={active}
    >
      <Heart className={`h-4 w-4 transition-all ${active ? "scale-110 fill-rose-500 text-rose-500" : "text-zinc-400"}`} />
      {count}
    </button>
  );
}

export function FavoriteButton({ targetType, targetId, label }) {
  const state = useDb();
  const user = db.getCurrentUser(state);
  const active = db.isFavorited(state, targetType, targetId);
  const count = db.favoriteCountFor(state, targetType, targetId);
  return (
    <button
      type="button"
      onClick={() => {
        if (!user) { alert("请先登录"); return; }
        try {
          act(db.toggleFavorite, targetType, targetId);
        } catch (e) {
          alert(e.message);
        }
      }}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-all active:scale-90 ${
        active ? "bg-blue-50 text-blue-600" : "text-zinc-500 hover:bg-zinc-50 hover:text-ink"
      }`}
      title={label ?? "收藏"}
      aria-pressed={active}
    >
      <Bookmark className={`h-4 w-4 transition-all ${active ? "scale-110 fill-blue-500 text-blue-500" : "text-zinc-400"}`} />
      {count}
    </button>
  );
}

export function FollowButton({ userId }) {
  const state = useDb();
  const user = db.getCurrentUser(state);
  const following = user ? db.isFollowing(state, user.id, userId) : false;
  const followers = db.followerCount(state, userId);
  return (
    <button
      type="button"
      onClick={() => {
        if (!user) {
          alert("请先登录");
          return;
        }
        try {
          act(db.toggleFollow, userId);
        } catch (e) {
          alert(e.message);
        }
      }}
      className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
        following ? "border border-line bg-white text-zinc-600 hover:bg-zinc-50" : "bg-accent text-white hover:bg-blue-700"
      }`}
    >
      {following ? "已关注" : "关注"} <span className="ml-1 opacity-70">{followers}</span>
    </button>
  );
}

export function ScenarioTabs({ current, onChange }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {db.SCENARIOS.map((s) => (
        <button
          key={s.type}
          type="button"
          onClick={() => onChange(s.type)}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition ${
            current === s.type ? "bg-accent text-white" : "bg-zinc-50 text-zinc-600 hover:bg-blue-50 hover:text-accent"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function RatingBars({ reviews, dims }) {
  return (
    <div className="space-y-2">
      {dims.map((dim) => {
        const values = reviews
          .map((r) => JSON.parse(r.ratings || "{}")[dim.key])
          .filter((v) => typeof v === "number");
        const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
        return (
          <div key={dim.key} className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-16 shrink-0">{dim.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(avg ?? 0) * 20}%` }} />
            </div>
            <span className="w-8 text-right">{avg ? avg.toFixed(1) : "-"}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ReviewList({ reviews }) {
  const state = useDb();
  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const author = state.users.find((u) => u.id === review.authorId);
        const schools = JSON.parse(author?.verifiedSchools || "[]");
        return (
          <article key={review.id} className="card p-4">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <Link to={`/user/${author?.id}`} className="font-medium text-zinc-600 hover:text-accent">{author?.nickname}</Link>
              <VerifiedBadge schools={schools} />
              <span>{review.degreeLevel === "master" ? "硕士" : "本科"}</span>
              {review.enrolledYear && <span>{review.enrolledYear} 级</span>}
              {review.isAlumni && <span className="text-accent">校友</span>}
              <span className="ml-auto">{db.formatRelative(review.createdAt)}</span>
            </div>
            <p className="text-sm leading-relaxed text-ink">{review.content}</p>
          </article>
        );
      })}
    </div>
  );
}

export function ReviewForm({ schoolId, schoolName, target, courseId, teacherId, majorId, dims }) {
  const state = useDb();
  const user = db.getCurrentUser(state);
  const [ratings, setRatings] = useState({});
  const [content, setContent] = useState("");
  const [enrolledYear, setEnrolledYear] = useState("");
  const [isAlumni, setIsAlumni] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const canReview = user ? JSON.parse(user.verifiedSchools || "[]").includes(schoolName) : false;

  function submit(e) {
    e.preventDefault();
    setError("");
    try {
      act(db.createReview, {
        schoolId,
        majorId,
        courseId,
        teacherId,
        degreeLevel: "bachelor",
        enrolledYear: enrolledYear ? Number(enrolledYear) : null,
        isAlumni,
        ratings,
        content,
      });
      setContent("");
      setRatings({});
      setOk(true);
      window.setTimeout(() => setOk(false), 1500);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <p className="rounded-md border border-line bg-zinc-50 px-3 py-2 text-xs text-zinc-500">请先登录后发表评价</p>;
  }
  if (!canReview) {
    return <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">需要完成{schoolName}邮箱认证后才能发表评价</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {dims.map((dim) => (
          <div key={dim.key}>
            <p className="mb-1 text-xs text-zinc-500">{dim.label}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRatings((prev) => ({ ...prev, [dim.key]: n }))}
                  className="rounded p-0.5 transition-transform active:scale-90"
                  aria-label={`${dim.label} ${n} 星`}
                >
                  <Star className={`h-5 w-5 transition-colors ${(ratings[dim.key] ?? 0) >= n ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <label className="label">短评（≤500 字）</label>
        <textarea className="input min-h-[80px] resize-y" value={content} onChange={(e) => setContent(e.target.value.slice(0, 500))} placeholder="说说真实体验" required />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={isAlumni} onChange={(e) => setIsAlumni(e.target.checked)} />
        我已毕业，以校友身份评价
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {ok && <p className="text-sm font-medium text-emerald-600">评价已发布</p>}
      <button type="submit" className="btn-primary">发布结构化评价</button>
    </form>
  );
}

/* ---------- 经验帖卡片 ---------- */
export function ExperiencePostCard({ post }) {
  const state = useDb();
  const author = state.users.find((u) => u.id === post.authorId);
  const schools = JSON.parse(author?.verifiedSchools || "[]");
  const typeMeta = db.POST_TYPES.find((p) => p.key === post.postType);
  const isAvoid = post.postType === "avoid";
  let images = [];
  try { images = JSON.parse(post.images || "[]"); } catch { images = []; }
  const cover = images[0];
  const likeCount = db.starCountFor(state, "experience_post", post.id);
  const favCount = db.favoriteCountFor(state, "experience_post", post.id);
  return (
    <div className="card block p-5 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${isAvoid ? "bg-red-50 text-red-600" : "bg-blue-50 text-accent"}`}>
              {typeMeta?.label ?? post.postType}
            </span>
            {post.status === "folded" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                <ShieldAlert className="h-3.5 w-3.5" />已折叠
              </span>
            )}
          </div>
          <Link to={`/posts/${post.id}`} className="text-[15px] font-semibold leading-snug text-ink hover:text-accent">
            {post.title}
          </Link>
          <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{post.content}</p>
        </div>
        {cover && (
          <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line sm:block">
            <img src={cover} alt="配图" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1" title="点赞数">
          <Heart className={`h-3.5 w-3.5 ${likeCount > 0 ? "fill-rose-400 text-rose-400" : "text-zinc-400"}`} />
          {likeCount}
        </span>
        <span className="inline-flex items-center gap-1" title="收藏数">
          <Bookmark className={`h-3.5 w-3.5 ${favCount > 0 ? "fill-blue-400 text-blue-400" : "text-zinc-400"}`} />
          {favCount}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Link to={`/user/${author?.id}`} className="font-medium text-zinc-600 hover:text-accent">{author?.nickname}</Link>
          <VerifiedBadge schools={schools} />
        </span>
        <span>{db.formatRelative(post.createdAt)}</span>
      </div>
    </div>
  );
}

/* ---------- 配图上传（浏览器端压缩 data URL） ---------- */
const MAX_DIMENSION = 1280;
const QUALITY = 0.82;

function fileToCompressedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("无法处理图片")); return; }
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      image.onerror = () => reject(new Error("图片解析失败，请换一张"));
      image.src = dataUrl;
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({ images, onChange, max = 6 }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const remaining = max - images.length;
      const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remaining);
      const next = [];
      for (const file of list) {
        const compressed = await fileToCompressedDataUrl(file);
        next.push(compressed);
      }
      onChange([...images, ...next].slice(0, max));
    } catch (e) {
      setError(e.message || "图片处理失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((src, index) => (
          <div key={index} className="relative h-20 w-20 overflow-hidden rounded-lg border border-line">
            <img src={src} alt={`配图 ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              title="移除图片"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < max && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-zinc-400 transition hover:border-accent hover:text-accent">
            <span className="text-lg leading-none">＋</span>
            <span className="text-[11px]">{busy ? "处理中" : "配图"}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <p className="text-xs text-zinc-400">最多 {max} 张，自动压缩（最长边 1280px）。敏感信息请打码。</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ---------- 配图展示（网格 + 灯箱） ---------- */
export function ImageGallery({ images, className }) {
  const [active, setActive] = useState(null);
  if (!images || images.length === 0) return null;
  return (
    <>
      <div className={className ?? "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"}>
        {images.map((src, index) => (
          <button key={index} type="button" onClick={() => setActive(index)} className="group relative overflow-hidden rounded-lg border border-line">
            <img src={src} alt={`配图 ${index + 1}`} className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" loading="lazy" />
          </button>
        ))}
      </div>
      {active !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setActive(null)}>
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" onClick={() => setActive(null)} aria-label="关闭">
            ✕
          </button>
          <img src={images[active]} alt={`配图 ${active + 1}`} className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

/* ---------- 学校卡片 ---------- */
export function SchoolCard({ school }) {
  return (
    <Link to={`/school/${school.slug}`} className="card block p-5 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent">
              {school.region || "地区未知"} · {school.type || "高校"}
            </span>
            {school.verified && <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-600">已认证档案</span>}
          </div>
          <p className="text-[15px] font-semibold text-ink transition-colors hover:text-accent">{school.name}</p>
        </div>
        <span className="shrink-0 text-2xl font-semibold text-accent">{school.reviewCount}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span>{school.reviewCount} 条认证评价</span>
        <span>{school.majorCount} 个专业</span>
        <span>{school.questionCount} 条提问</span>
      </div>
    </Link>
  );
}