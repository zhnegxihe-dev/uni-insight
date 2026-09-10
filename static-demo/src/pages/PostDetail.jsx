import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, CornerUpRight, Download, ImageDown, Share2, ShieldAlert, X } from "lucide-react";
import { useDb } from "../store";
import * as db from "../db";
import { LikeButton, FavoriteButton, VerifiedBadge, ImageGallery } from "../components";

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const ch of text) {
    if (ch === "\n") { lines.push(line); line = ""; continue; }
    if (ctx.measureText(line + ch).width > maxWidth && line) { lines.push(line); line = ch; } else line += ch;
  }
  if (line) lines.push(line);
  return lines;
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function drawCard(post, author, schools, sourceText, typeLabel) {
  const c = document.createElement("canvas"); c.width = 720; c.height = 960;
  const ctx = c.getContext("2d"); if (!ctx) return null;
  const color = post.postType === "avoid" ? "#dc2626" : "#2563eb";
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 720, 960);
  ctx.fillStyle = "rgba(37,99,235,0.06)"; ctx.fillRect(0, 0, 720, 10);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(64, 92, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "bold 26px sans-serif"; ctx.textAlign = "center"; ctx.fillText("问", 64, 101);
  ctx.textAlign = "left"; ctx.fillStyle = "#111827"; ctx.font = "bold 30px sans-serif"; ctx.fillText("UniInsight · 升学问问", 108, 101);
  if (typeLabel) { ctx.fillStyle = "rgba(37,99,235,0.12)"; rr(ctx, 48, 132, 24 + ctx.measureText(typeLabel).width + 8, 36, 18); ctx.fill(); ctx.fillStyle = color; ctx.font = "600 22px sans-serif"; ctx.fillText(typeLabel, 56, 158); }
  ctx.fillStyle = "#111827"; ctx.font = "bold 34px sans-serif";
  let y = 232;
  for (const line of wrap(ctx, post.title, 624).slice(0, 5)) { ctx.fillText(line, 48, y); y += 48; }
  ctx.fillStyle = "#52525b"; ctx.font = "26px sans-serif"; y += 14;
  const body = wrap(ctx, String(post.content || "").replace(/\s+/g, " ").slice(0, 420), 624).slice(0, 15);
  for (const line of body) { ctx.fillText(line, 48, y); y += 40; }
  if (body.length >= 15) ctx.fillText("…", 48, y);
  if (sourceText) {
    y = 960 - 150; ctx.fillStyle = "#f4f4f5"; rr(ctx, 48, y - 34, 624, 68, 12); ctx.fill();
    ctx.fillStyle = "#71717a"; ctx.font = "22px sans-serif";
    let sy = y - 6;
    for (const line of wrap(ctx, sourceText, 590).slice(0, 2)) { ctx.fillText(line, 64, sy); sy += 28; }
  }
  ctx.fillStyle = "#111827"; ctx.font = "600 26px sans-serif";
  const authorLabel = `@${author?.nickname || "学长学姐"}`;
  ctx.fillText(authorLabel, 48, 960 - 72);
  if (schools && schools.length) {
    ctx.fillStyle = color; ctx.font = "20px sans-serif";
    const bw = ctx.measureText(schools[0]).width + 16;
    rr(ctx, 56 + ctx.measureText(authorLabel).width + 8, 960 - 96, bw, 32, 16); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(schools[0], 60 + ctx.measureText(authorLabel).width + 16, 960 - 73);
  }
  ctx.fillStyle = "#a1a1aa"; ctx.font = "20px sans-serif"; ctx.textAlign = "right";
  ctx.fillText("真实经验，帮助后来人", 672, 960 - 72); ctx.textAlign = "left";
  return c.toDataURL("image/png");
}

export default function PostDetail() {
  const { id } = useParams();
  const state = useDb();
  const post = db.getExperiencePost(state, id);
  const [shareOpen, setShareOpen] = useState(false);
  const [cardSrc, setCardSrc] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!post) return <div className="card p-10 text-center text-sm text-zinc-400">帖子不存在</div>;
  if (post.status === "hidden") return <div className="card p-10 text-center text-sm text-zinc-400">该帖因被确认违规已被隐藏</div>;

  const typeMeta = db.POST_TYPES.find((p) => p.key === post.postType);
  const isAvoid = post.postType === "avoid";
  const isPromo = post.postType === "promo";
  const schools = JSON.parse(post.author?.verifiedSchools || "[]");
  const scenarioLabel = post.scenarioType ? (db.SCENARIO_LABEL[post.scenarioType] ?? post.scenarioType) : null;
  const source = db.postSource(state, post);
  const reviewSource = post.sourceReviewId
    ? (() => {
        const rv = state.merchantReviews.find((r) => r.id === post.sourceReviewId);
        if (!rv) return null;
        const m = state.merchants.find((x) => x.id === rv.merchantId);
        return { merchantId: rv.merchantId, merchantName: m?.name ?? post.merchantName ?? "商户" };
      })()
    : null;
  let images = []; try { images = JSON.parse(post.images || "[]"); } catch {}
  const sourceText = source && !source.degraded ? `${source.isQuote ? "引用了" : "由"} @${source.replyAuthorName} 的回复 · 转自《${source.question?.title || ""}》` : null;

  function openShare() { setCardSrc(drawCard(post, post.author, schools, sourceText, typeMeta?.label ?? post.postType)); setCopied(false); setShareOpen(true); }
  async function copyLink() {
    try { await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/posts/${post.id}`); setCopied(true); } catch {}
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/posts" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink"><ChevronLeft className="h-4 w-4" />返回经验帖</Link>
      {post.status === "folded" && (<div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700"><ShieldAlert className="h-4 w-4 shrink-0" />该帖因多次举报已被折叠，正在人工审核中。</div>)}

      <section className="card p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${isAvoid ? "bg-red-50 text-red-600" : isPromo ? "bg-blue-600 text-white" : "bg-blue-50 text-accent"}`}>{typeMeta?.label ?? post.postType}{isPromo && post.merchantName ? ` · ${post.merchantName}` : ""}</span>
          {scenarioLabel && <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-600">{scenarioLabel}</span>}
          {source && !source.degraded && <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-600"><CornerUpRight className="h-3 w-3" />由回复{source.isQuote ? "引用" : "升级"}生成</span>}
        </div>

        {reviewSource && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-zinc-600">
            <CornerUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>
              本帖由一条商户评价同步而来，来自
              <Link to={`/merchant/${reviewSource.merchantId}`} className="mx-1 font-medium text-accent hover:underline">《{reviewSource.merchantName}》</Link>
              的主页。
            </span>
          </div>
        )}

        {source && source.degraded && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-700">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>来源回复已被折叠或隐藏（原文不再展示），本帖为作者后续创作的内容。{source.question ? <Link to={`/question/${source.question.id}`} className="ml-1 font-medium underline">查看原问题</Link> : null}</span>
          </div>
        )}
        {source && !source.degraded && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-zinc-600">
            <CornerUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>
              本帖{source.isQuote ? "引用" : "由"} <span className="font-medium text-zinc-700">@{source.replyAuthorName}</span> 的回复{source.isQuote ? "展开创作而来，转自" : "升级而来，转自"}
              <Link to={`/question/${source.question?.id}`} className="mx-1 font-medium text-accent hover:underline">《{source.question?.title}》</Link>
              {source.isQuote ? "，原回复作者会收到通知。" : `，原文回复仍保留在原问题下。回复：「${source.replySnippet}」`}
            </span>
          </div>
        )}

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
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <LikeButton targetType="experience_post" targetId={post.id} label="这篇经验有帮助" />
            <FavoriteButton targetType="experience_post" targetId={post.id} label="收藏这篇经验帖" />
          </div>
          <button type="button" onClick={openShare} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-zinc-500 transition hover:border-accent hover:text-accent">
            <ImageDown className="h-3.5 w-3.5" />分享卡片
          </button>
        </div>
      </section>

      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShareOpen(false)}>
          <div className="card w-full max-w-md space-y-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">分享卡片</h3>
              <button type="button" onClick={() => setShareOpen(false)} className="text-zinc-400 hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            {cardSrc ? (
              <img src={cardSrc} alt="分享卡片" className="w-full rounded-xl border border-zinc-200" />
            ) : (
              <div className="py-10 text-center text-sm text-zinc-400">生成中…</div>
            )}
            <div className="flex gap-2">
              {cardSrc && (
                <a href={cardSrc} download={`uni-insight-post-${post.id}.png`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
                  <Download className="h-4 w-4" />保存图片
                </a>
              )}
              <button type="button" onClick={copyLink} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm text-zinc-600">
                <Share2 className="h-4 w-4" />{copied ? "已复制" : "复制链接"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
