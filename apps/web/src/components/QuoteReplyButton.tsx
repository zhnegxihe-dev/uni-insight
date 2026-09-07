"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquareQuote, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/format";
import { ImageUploader } from "@/components/ImageUploader";

const CONCRETE_SCENARIOS = ["gaokao", "transfer", "grad_cn", "grad_abroad", "advisor", "career"];
const AVOID_HINTS = ["坑", "避雷", "踩雷", "别选", "不要", "后悔", "劝退", "注意", "雷", "骗", "坑钱"];

interface QuoteReplyButtonProps {
  replyId: string;
  questionId: string;
  replyContent: string;
  replyAuthorName: string;
  questionTitle: string;
  scenarioType: string;
}

function quotedContent(replyContent: string, replyAuthorName: string, questionTitle: string, extra: string): string {
  return `“${replyContent}”\n（引用于 @${replyAuthorName} 在《${questionTitle}》下的回复）\n\n${extra}`;
}

function firstSentence(content: string): string {
  const t = content.replace(/\s+/g, " ").trim();
  const head = t.split(/[。！？!?；;，,\n]/).find((p) => p.trim().length > 0)?.trim() || t;
  return head.length > 42 ? head.slice(0, 42) + "…" : head;
}

function titleCandidates(replyContent: string, questionTitle: string, postType: string): string[] {
  const sent = firstSentence(replyContent) || "我的真实经验";
  const tag = postType === "avoid" ? "避雷" : "经验";
  const base = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);
  return [
    `转述@ta 的回复｜${base(sent, 24)}`,
    `关于《${questionTitle}》的${tag}分享：${base(sent, 12)}`,
    `${postType === "avoid" ? "听完这条经历，我想提醒" : "这条回复值得展开"}｜${base(sent, 18)}`,
  ];
}

/** 引用他人回复发帖（抖音形态②，蓝图 v4.6 §8.16） */
export function QuoteReplyButton({
  replyId,
  questionId,
  replyContent,
  replyAuthorName,
  questionTitle,
  scenarioType,
}: QuoteReplyButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [postType, setPostType] = useState<"experience" | "avoid">(AVOID_HINTS.some((k) => replyContent.includes(k)) ? "avoid" : "experience");
  const [title, setTitle] = useState("");
  const [titleIdx, setTitleIdx] = useState(0);
  const [extra, setExtra] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ownPartLen = () => extra.replace(/\s/g, "").length;

  function openPanel() {
    const type = AVOID_HINTS.some((k) => replyContent.includes(k)) ? "avoid" : "experience";
    setPostType(type);
    const list = titleCandidates(replyContent, questionTitle, type);
    setTitle(list[0]);
    setTitleIdx(0);
    setExtra("");
    setImages([]);
    setError("");
    setOpen(true);
  }

  function cycle() {
    const list = titleCandidates(replyContent, questionTitle, postType);
    const next = (titleIdx + 1) % list.length;
    setTitleIdx(next);
    setTitle(list[next]);
  }

  function changeType(type: "experience" | "avoid") {
    setPostType(type);
    const list = titleCandidates(replyContent, questionTitle, type);
    setTitleIdx(0);
    setTitle(list[0]);
  }

  async function submit() {
    if (busy) return;
    const t = title.trim();
    if (!t) { setError("请填写标题"); return; }
    if (ownPartLen() < 10) { setError("请补充至少 10 字你自己的看法/点评（引用他人内容不算）"); return; }
    const content = quotedContent(replyContent, replyAuthorName, questionTitle, extra.trim());
    setBusy(true);
    setError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: t,
        content,
        postType,
        mode: "quote",
        scenarioType: CONCRETE_SCENARIOS.includes(scenarioType) ? scenarioType : null,
        schoolId: null,
        majorId: null,
        courseId: null,
        teacherId: null,
        images,
        sourceReplyId: replyId,
        sourceQuestionId: questionId,
      }),
    });
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push(`/posts/${data.id}`);
      router.refresh();
    } else {
      setError(data.error || "发布失败，请稍后重试");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        title="基于这条回复展开聊，发布为一篇自己的帖子（原文以引用块展示并回源）"
        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 transition hover:text-violet-600"
      >
        <MessageSquareQuote className="h-3 w-3" />
        引用发帖
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setOpen(false)}>
          <div className="card max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-ink">基于回复发一帖</h3>
                <p className="mt-0.5 text-xs text-zinc-400">引用 @{replyAuthorName} 的回复，加上你自己的看法，成为一篇独立帖子（作者是你）</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="text-zinc-400 transition hover:text-ink" title="关闭">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-xs text-zinc-500">
              <span className="font-medium text-zinc-600">被引用的回复 · @{replyAuthorName}</span>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{replyContent}</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">帖子类型</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => changeType("experience")} className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition", postType === "experience" ? "border-blue-300 bg-blue-50 text-accent" : "border-line text-zinc-500 hover:bg-zinc-50")}>
                  经验帖<span className="block text-xs font-normal text-zinc-400">展开有价值的信息</span>
                </button>
                <button type="button" onClick={() => changeType("avoid")} className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition", postType === "avoid" ? "border-red-300 bg-red-50 text-red-600" : "border-line text-zinc-500 hover:bg-zinc-50")}>
                  避雷帖<span className="block text-xs font-normal text-zinc-400">结合经历提醒避坑</span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">标题（≤100 字）</label>
              <div className="flex gap-2">
                <input className="input flex-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
                <button type="button" onClick={cycle} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-3 text-xs text-zinc-500 transition hover:border-accent hover:text-accent">
                  <RefreshCw className="h-3.5 w-3.5" />
                  换标题
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">你的看法 / 补充（≥10 字，会与引用一起发布）</label>
              <textarea className="input min-h-28" value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={1000} placeholder="为什么认同/不认同？还有哪些细节可以补充？" />
              <p className={cn("mt-1 text-right text-xs", ownPartLen() >= 10 ? "text-emerald-600" : "text-zinc-400")}>{ownPartLen()}/10+</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">配图（可选，自动压缩）</label>
              <ImageUploader images={images} onChange={setImages} />
            </div>

            <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-400">发布后原回复作者会收到「被引用」通知；本帖会标注引用来源并回链原问题。内容需真实、不曲解原意，违规会被举报处理。</p>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded-lg border border-line px-4 py-2 text-sm text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-50">取消</button>
              <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                发布帖子
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
