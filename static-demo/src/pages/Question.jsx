import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, ChevronLeft, CornerUpRight, Eye, Loader2, MessageSquare, MessageSquareQuote, RefreshCw, Send, ShieldAlert, X } from "lucide-react";
import { useDb, act } from "../store";
import * as db from "../db";
import { LikeButton, FavoriteButton, VerifiedBadge, ImageUploader } from "../components";

const AVOID_HINTS = ["坑", "避雷", "踩雷", "别选", "不要", "后悔", "劝退", "注意", "雷", "骗", "坑钱"];
const CONCRETE = ["gaokao", "transfer", "grad_cn", "grad_abroad", "advisor", "career"];

function firstSentence(content) {
  const t = String(content || "").replace(/\s+/g, " ").trim();
  const head = t.split(/[。！？!?；;，,\n]/).find((p) => p.trim().length > 0)?.trim() || t;
  return head.length > 26 ? head.slice(0, 26) + "…" : head;
}
function pickType(content) { return AVOID_HINTS.some((k) => String(content).includes(k)) ? "avoid" : "experience"; }
function cut(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }
function titleCandidates(content, questionTitle, postType) {
  const sent = firstSentence(content) || "我的真实经验";
  const tag = postType === "avoid" ? "避雷" : "经验";
  return [sent, `关于《${questionTitle}》的${tag}分享：${cut(sent, 14)}`, `${postType === "avoid" ? "别踩这些坑" : "最真实有用的细节"}｜${cut(sent, 18)}`];
}
function quotedText(replyContent, authorName, questionTitle, extra) {
  return `“${replyContent}”\n（引用于 @${authorName} 在《${questionTitle}》下的回复）\n\n${extra}`;
}
function maxRun(ids) {
  let best = { len: 0, start: 0 };
  for (let i = 0; i < ids.length; i++) {
    if (i + 1 >= ids.length) { if (1 > best.len) best = { len: 1, start: i }; break; }
    const a = ids[i], b = ids[i + 1];
    if (a === b) continue;
    let len = 2;
    for (let k = i + 2; k < ids.length; k++) { const exp = ids[k - 1] === a ? b : a; if (ids[k] !== exp) break; len++; }
    if (len > best.len) best = { len, start: i };
  }
  return best;
}

/* ---------- 升级为帖子 ---------- */
function UpgradeModal({ question, reply, onClose }) {
  const navigate = useNavigate();
  const [postType, setPostType] = useState(pickType(reply.content));
  const [title, setTitle] = useState(titleCandidates(reply.content, question.title, pickType(reply.content))[0]);
  const [content, setContent] = useState(reply.content);
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function changeType(t) { setPostType(t); setTitle(titleCandidates(content, question.title, t)[0]); }
  async function submit() {
    if (busy) return;
    if (!title.trim() || !content.trim()) { setError("请填写标题与正文"); return; }
    setBusy(true); setError("");
    try {
      const post = act(db.createExperiencePost, { title: title.trim(), content: content.trim(), postType, scenarioType: CONCRETE.includes(question.scenarioType) ? question.scenarioType : null, schoolId: null, majorId: null, courseId: null, teacherId: null, images, merchantName: null, mode: "upgrade", sourceReplyId: reply.id, sourceQuestionId: question.id });
      navigate(`/posts/${post.id}`);
    } catch (e) { setError(e.message); setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && onClose()}>
      <div className="card max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">把回复升级为帖子</h3>
            <p className="mt-0.5 text-xs text-zinc-400">你的回答也能变成一篇可沉淀、可分享的独立内容（原回复保留）</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-xs text-zinc-500">
          <span className="font-medium text-zinc-600">来源回复</span>
          <p className="mt-1 whitespace-pre-wrap">{reply.content}</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">帖子类型</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => changeType("experience")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${postType === "experience" ? "border-blue-300 bg-blue-50 text-accent" : "border-line text-zinc-500"}`}>经验帖</button>
            <button type="button" onClick={() => changeType("avoid")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${postType === "avoid" ? "border-red-300 bg-red-50 text-red-600" : "border-line text-zinc-500"}`}>避雷帖</button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">标题（≤100 字）</label>
          <div className="flex gap-2">
            <input className="input flex-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
            <button type="button" onClick={() => { const list = titleCandidates(content, question.title, postType); setTitle(list[Math.floor(Math.random() * list.length)]); }} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-3 text-xs text-zinc-500 hover:text-accent"><RefreshCw className="h-3.5 w-3.5" />换标题</button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">正文（≤3000 字）</label>
          <textarea className="input min-h-32" value={content} onChange={(e) => setContent(e.target.value)} maxLength={3000} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">配图（可选）</label>
          <ImageUploader images={images} onChange={setImages} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-line px-4 py-2 text-sm text-zinc-500">取消</button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}发布为帖子
          </button>
        </div>
      </div>
    </div>
  );
}
/* ---------- 引用发帖 ---------- */
function QuoteModal({ question, reply, onClose }) {
  const navigate = useNavigate();
  const [postType, setPostType] = useState(pickType(reply.content));
  const [title, setTitle] = useState(titleCandidates(reply.content, question.title, pickType(reply.content))[0]);
  const [extra, setExtra] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ownLen = extra.replace(/\s/g, "").length;

  function changeType(t) { setPostType(t); setTitle(titleCandidates(reply.content, question.title, t)[0]); }
  async function submit() {
    if (busy) return;
    if (!title.trim()) { setError("请填写标题"); return; }
    if (ownLen < 10) { setError("请补充至少 10 字你自己的看法/点评"); return; }
    const content = quotedText(reply.content, reply.author?.nickname || "对方", question.title, extra.trim());
    setBusy(true); setError("");
    try {
      const post = act(db.createExperiencePost, { title: title.trim(), content, postType, scenarioType: CONCRETE.includes(question.scenarioType) ? question.scenarioType : null, schoolId: null, majorId: null, courseId: null, teacherId: null, images, merchantName: null, mode: "quote", sourceReplyId: reply.id, sourceQuestionId: question.id });
      navigate(`/posts/${post.id}`);
    } catch (e) { setError(e.message); setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && onClose()}>
      <div className="card max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">基于回复发一帖</h3>
            <p className="mt-0.5 text-xs text-zinc-400">引用 @{reply.author?.nickname} 的回复 + 你自己的看法，成为一篇独立帖子</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-xs text-zinc-500">
          <span className="font-medium text-zinc-600">被引用的回复 · @{reply.author?.nickname}</span>
          <p className="mt-1 whitespace-pre-wrap">{reply.content}</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">帖子类型</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => changeType("experience")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${postType === "experience" ? "border-blue-300 bg-blue-50 text-accent" : "border-line text-zinc-500"}`}>经验帖</button>
            <button type="button" onClick={() => changeType("avoid")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${postType === "avoid" ? "border-red-300 bg-red-50 text-red-600" : "border-line text-zinc-500"}`}>避雷帖</button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">标题（≤100 字）</label>
          <div className="flex gap-2">
            <input className="input flex-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
            <button type="button" onClick={() => { const list = titleCandidates(reply.content, question.title, postType); setTitle(list[Math.floor(Math.random() * list.length)]); }} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-3 text-xs text-zinc-500 hover:text-accent"><RefreshCw className="h-3.5 w-3.5" />换标题</button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">你的看法 / 补充（≥10 字）</label>
          <textarea className="input min-h-28" value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={1000} />
          <p className={`mt-1 text-right text-xs ${ownLen >= 10 ? "text-emerald-600" : "text-zinc-400"}`}>{ownLen}/10+</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">配图（可选）</label>
          <ImageUploader images={images} onChange={setImages} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-line px-4 py-2 text-sm text-zinc-500">取消</button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}发布帖子
          </button>
        </div>
      </div>
    </div>
  );
}
/* ---------- 转新帖 ---------- */
function ForkModal({ question, items, onClose }) {
  const navigate = useNavigate();
  const first = firstSentence(items[0]?.content || "");
  const baseTitle = first ? `关于《${question.title}》中“${first}”的深入讨论` : `关于《${question.title}》的深入讨论`;
  const [title, setTitle] = useState(baseTitle);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (busy) return;
    if (!title.trim()) { setError("请填写标题"); return; }
    setBusy(true); setError("");
    try {
      const q = act(db.createQuestionFork, { title: title.trim(), description: note.trim() || null, originQuestionId: question.id, forkedFromReplyIds: items.map((i) => i.replyId) });
      navigate(`/question/${q.id}`);
    } catch (e) { setError(e.message); setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && onClose()}>
      <div className="card max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">转为新帖</h3>
            <p className="mt-0.5 text-xs text-zinc-400">新帖会自动带上引用快照，并继承原问题的场景与标签</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-xs text-zinc-500">
          <div className="font-medium text-zinc-600">引用快照 · 转自《{question.title}》</div>
          <div className="mt-1.5 space-y-1.5">
            {items.map((it) => (<p key={it.replyId} className="whitespace-pre-wrap"><span className="font-medium text-zinc-600">@{it.authorName}：</span>{it.content}</p>))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">新帖标题（≤150 字）</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">补充说明（可选）</label>
          <textarea className="input min-h-24" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-line px-4 py-2 text-sm text-zinc-500">取消</button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}发布新帖
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 单条回复卡片 ---------- */
function ReplyItem({ reply, question, canAccept, currentUserId, isRoot, onReply, onUpgrade, onQuote, onFork }) {
  const [foldedOpen, setFoldedOpen] = useState(false);
  const schools = JSON.parse(reply.author?.verifiedSchools || "[]");
  const isOwn = currentUserId === reply.authorId;
  const body = (
    <article className="card p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link to={`/user/${reply.author?.id}`} className="font-medium text-zinc-600 hover:text-accent">{reply.author?.nickname}</Link>
        <VerifiedBadge schools={schools} />
        <span>L{reply.author?.level}</span>
        {!isRoot && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">追问</span>}
        {reply.isAccepted && (<span className="inline-flex items-center gap-0.5 font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />最有用</span>)}
        <span className="ml-auto">{db.formatRelative(reply.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink">{reply.content}</p>
      <div className="mt-3 space-y-2 border-t border-line pt-2.5">
        <div className="flex flex-wrap items-center gap-3">
          {isRoot && canAccept && !reply.isAccepted && (
            <button type="button" onClick={() => act((s) => {
              for (const r of s.replies) if (r.questionId === question.id) r.isAccepted = false;
              const target = s.replies.find((r) => r.id === reply.id);
              if (target) target.isAccepted = true;
              const q = s.questions.find((x) => x.id === question.id);
              if (q) q.acceptedReplyId = reply.id;
              if (question.authorId !== reply.authorId) db.notify(s, reply.authorId, "accept", { type: "accept", actorId: question.authorId, actorName: s.users.find((u) => u.id === question.authorId)?.nickname, questionId: question.id, questionTitle: question.title });
            })} className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100">采纳</button>
          )}
          <LikeButton targetType="reply" targetId={reply.id} label="这条回复有帮助" />
          <FavoriteButton targetType="reply" targetId={reply.id} label="收藏这条回复" />
        </div>
        {currentUserId && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
            {isRoot && (<button type="button" onClick={onReply} className="inline-flex items-center gap-1 text-zinc-400 transition hover:text-accent"><MessageSquare className="h-3 w-3" />追问</button>)}
            {isOwn && reply.status === "visible" && (<button type="button" onClick={onUpgrade} className="inline-flex items-center gap-1 text-zinc-400 transition hover:text-accent"><ArrowUpRight className="h-3 w-3" />升级为帖子</button>)}
            {!isOwn && reply.status === "visible" && (<button type="button" onClick={onQuote} className="inline-flex items-center gap-1 text-zinc-400 transition hover:text-violet-600"><MessageSquareQuote className="h-3 w-3" />引用发帖</button>)}
            {reply.status === "visible" && (<button type="button" onClick={onFork} className="inline-flex items-center gap-1 text-zinc-400 transition hover:text-accent"><CornerUpRight className="h-3 w-3" />转新帖</button>)}
          </div>
        )}
      </div>
    </article>
  );
  if (reply.status === "folded") {
    return foldedOpen ? (
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-amber-600">
          <span>已展开被折叠内容（仍在审核中）</span>
          <button type="button" onClick={() => setFoldedOpen(false)}>收起</button>
        </div>
        {body}
      </div>
    ) : (
      <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
        <p className="text-xs text-amber-700">该回复因多次举报已被折叠</p>
        <button type="button" onClick={() => setFoldedOpen(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"><Eye className="h-3.5 w-3.5" />展开查看</button>
      </div>
    );
  }
  return body;
}
/* ---------- 问题详情页 ---------- */
export default function Question() {
  const { id } = useParams();
  const state = useDb();
  const user = db.getCurrentUser(state);
  const question = db.getQuestion(state, id);
  const [composingRoot, setComposingRoot] = useState(null);
  const [childText, setChildText] = useState("");
  const [childError, setChildError] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [bottomError, setBottomError] = useState("");
  const [modal, setModal] = useState(null);
  const [ignored, setIgnored] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem("ui:fork-ignored") || "[]")); } catch { return new Set(); } });

  if (!question) return <div className="card p-10 text-center text-sm text-zinc-400">问题不存在</div>;
  if (question.status === "hidden") return <div className="card p-10 text-center text-sm text-zinc-400">该问题因违规已被隐藏</div>;

  const authorSchools = JSON.parse(question.author?.verifiedSchools || "[]");
  const origin = question.forkedFromQuestionId ? (state.questions.find((q) => q.id === question.forkedFromQuestionId) || null) : null;
  const related = db.getRelatedDerived(state, id);
  let forkIds = []; try { forkIds = JSON.parse(question.forkedFromReplyIds || "[]"); } catch {}
  const replyList = question.replies || [];
  const roots = replyList.filter((r) => !r.parentReplyId).sort((a, b) => b.starCount - a.starCount || new Date(a.createdAt) - new Date(b.createdAt));
  const orphans = replyList.filter((r) => r.parentReplyId && !replyList.some((x) => x.id === r.parentReplyId));
  const childOf = (rootId) => replyList.filter((r) => r.parentReplyId === rootId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  function openFork(reply) {
    if (!user) return;
    if (user.id !== reply.authorId && user.id !== question.authorId && !childOf(reply.id).some((c) => c.authorId === user.id)) return;
    setModal({ kind: "fork", items: [{ replyId: reply.id, authorName: reply.author?.nickname || "对方", content: reply.content }] });
  }
  function submitChild(rootId) {
    if (!childText.trim()) return;
    try {
      act(db.createReply, id, childText.trim(), { parentReplyId: rootId });
      setChildText(""); setChildError(""); setComposingRoot(null);
    } catch (e) { setChildError(e.message); }
  }
  function submitBottom() {
    if (!bottomText.trim()) return;
    try { act(db.createReply, id, bottomText.trim()); setBottomText(""); setBottomError(""); }
    catch (e) { setBottomError(e.message); }
  }
  function ignoreRoot(rootId) {
    const next = new Set(ignored); next.add(rootId); setIgnored(next);
    try { localStorage.setItem("ui:fork-ignored", JSON.stringify([...next])); } catch {}
  }

  function renderThread(root) {
    const children = childOf(root.id);
    const seq = [root, ...children].map((r) => r.authorId);
    const run = maxRun(seq);
    const runIds = seq.slice(run.start, run.start + run.len);
    const runSet = new Set(runIds);
    const lastBy = new Map();
    for (const r of [root, ...children]) lastBy.set(r.authorId, new Date(r.createdAt).getTime());
    const runAuthors = [...new Set(runIds)];
    const active24 = runAuthors.length >= 2 && runAuthors.every((a) => Date.now() - (lastBy.get(a) ?? 0) < 86400000);
    const healthy = [root, ...children].every((r) => r.status === "visible");
    const showBubble = run.len >= 3 && active24 && healthy && !ignored.has(root.id);
    const bubbleItems = showBubble ? [root, ...children].filter((r) => runSet.has(r.authorId)).slice(-3).map((r) => ({ replyId: r.id, authorName: r.author?.nickname || "对方", content: r.content })) : [];
    return (
      <div key={root.id} className={children.length > 0 ? "space-y-3" : undefined}>
        <ReplyItem reply={root} question={question} canAccept={user?.id === question.authorId} currentUserId={user?.id ?? null} isRoot
          onReply={() => { setComposingRoot(composingRoot === root.id ? null : root.id); setChildError(""); }}
          onUpgrade={() => setModal({ kind: "upgrade", reply: root })}
          onQuote={() => setModal({ kind: "quote", reply: root })}
          onFork={() => openFork(root)}
        />
        {composingRoot === root.id && (
          <div className="pl-3">
            <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
              <textarea autoFocus className="input min-h-[64px]" value={childText} onChange={(e) => setChildText(e.target.value.slice(0, 280))} placeholder={`追问 @${root.author?.nickname}（最多 280 字）`} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{childText.length}/280</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setComposingRoot(null)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-zinc-500">取消</button>
                  <button type="button" onClick={() => submitChild(root.id)} disabled={!childText.trim()} className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"><Send className="h-3.5 w-3.5" />发布追问</button>
                </div>
              </div>
              {childError && <p className="text-xs text-red-500">{childError}</p>}
            </div>
          </div>
        )}
        {children.length > 0 && (
          <div className="space-y-3 border-l-2 border-zinc-100 pl-3">
            {children.map((child) => (
              <ReplyItem key={child.id} reply={child} question={question} canAccept={user?.id === question.authorId} currentUserId={user?.id ?? null} isRoot={false}
                onReply={() => {}}
                onUpgrade={() => setModal({ kind: "upgrade", reply: child })}
                onQuote={() => setModal({ kind: "quote", reply: child })}
                onFork={() => openFork(child)}
              />
            ))}
            {showBubble && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-500">
                <span>你们围绕这条回复来回聊了 {run.len} 轮，要不要开个新帖继续深入？</span>
                <button type="button" onClick={() => setModal({ kind: "fork", items: bubbleItems })} className="inline-flex items-center gap-1 font-medium text-accent"><CornerUpRight className="h-3 w-3" />一键转帖</button>
                <button type="button" onClick={() => ignoreRoot(root.id)} className="text-zinc-400 hover:text-ink">忽略</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-ink"><ChevronLeft className="h-4 w-4" />返回发现页</Link>
      {question.status === "folded" && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700"><ShieldAlert className="h-4 w-4 shrink-0" />该问题因多次举报已被折叠，正在人工审核中。</div>
      )}
      {origin && origin.status !== "visible" ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-700"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>来源问题已被折叠或隐藏，本帖内容由作者后续创建。</span></div>
      ) : origin ? (
        <div className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-zinc-600">
          <CornerUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span>本问题由一段讨论转来，转自<Link to={`/question/${origin.id}`} className="mx-1 font-medium text-accent hover:underline">《{origin.title}》</Link>{forkIds.length > 0 && `（引用 ${forkIds.length} 条回复作为讨论起点）`}</span>
        </div>
      ) : null}

      <section className="card p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-accent">{db.SCENARIO_LABEL[question.scenarioType] ?? question.scenarioType}</span>
          {question.tags.map((tag) => (<Link key={tag.id} to={`/search?q=${encodeURIComponent(tag.name)}`} className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 hover:bg-blue-50 hover:text-accent">{tag.name}</Link>))}
        </div>
        <h1 className="text-lg font-semibold leading-snug text-ink">{question.title}</h1>
        {question.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{question.description}</p>}
        <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
          <Link to={`/user/${question.author?.id}`} className="font-medium text-zinc-600 hover:text-accent">{question.author?.nickname}</Link>
          <VerifiedBadge schools={authorSchools} />
          <span>{db.formatRelative(question.createdAt)}</span>
          <span className="ml-auto">{question.replyCount} 条回复</span>
        </div>
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <LikeButton targetType="question" targetId={question.id} label="问题有帮助，点赞" />
            <FavoriteButton targetType="question" targetId={question.id} label="收藏这个问题" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">全部回复</h2>
        {roots.length === 0 && orphans.length === 0 ? (
          <p className="card p-6 text-center text-sm text-zinc-400">还没有回复，来当第一个分享的人</p>
        ) : (
          <div className="space-y-3">
            {[...roots, ...orphans].map((root) => renderThread(root))}
          </div>
        )}
      </section>

      {(related.forkedQuestions.length > 0 || related.derivedPosts.length > 0) && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">衍生与相关</h2>
          <div className="space-y-2">
            {related.forkedQuestions.map((q) => (
              <Link key={q.id} to={`/question/${q.id}`} className="card block p-4 transition hover:border-zinc-300">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-medium text-accent"><CornerUpRight className="h-3 w-3" />转帖讨论</span>
                  <span>{q.author?.nickname}</span><span className="ml-auto">{q.replyCount} 回复 · {db.formatRelative(q.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-ink">{q.title}</p>
              </Link>
            ))}
            {related.derivedPosts.map((p) => (
              <Link key={p.id} to={`/posts/${p.id}`} className="card block p-4 transition hover:border-zinc-300">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 font-medium text-violet-600">{p.postType === "avoid" ? "避雷帖" : "经验帖"}{p.sourceReplyId ? " · 由回复生成" : ""}</span>
                  <span>{p.author?.nickname}</span><span className="ml-auto">{p.likeCount} 赞 · {db.formatRelative(p.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-ink">{p.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!composingRoot && (
        <div className="card p-4">
          <textarea value={bottomText} onChange={(e) => setBottomText(e.target.value.slice(0, 280))} placeholder={user ? "分享你的真实经验，最多 280 字（也可点某条回复下的「追问」深入讨论）" : "登录后可回复"} className="input min-h-[84px] resize-y" disabled={!user} />
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs ${bottomText.length >= 270 ? "text-red-500" : "text-zinc-400"}`}>{bottomText.length}/280</span>
            <button type="button" onClick={submitBottom} disabled={!user || !bottomText.trim()} className="btn-primary">发布回复</button>
          </div>
          {bottomError && <p className="mt-2 text-xs text-red-500">{bottomError}</p>}
        </div>
      )}

      {modal?.kind === "upgrade" && <UpgradeModal question={question} reply={modal.reply} onClose={() => setModal(null)} />}
      {modal?.kind === "quote" && <QuoteModal question={question} reply={modal.reply} onClose={() => setModal(null)} />}
      {modal?.kind === "fork" && <ForkModal question={question} items={modal.items} onClose={() => setModal(null)} />}
    </div>
  );
}
