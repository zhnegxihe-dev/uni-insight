"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/format";
import { ImageUploader } from "@/components/ImageUploader";

const CONCRETE_SCENARIOS = ["gaokao", "transfer", "grad_cn", "grad_abroad", "advisor", "career"];
const AVOID_HINTS = ["坑", "避雷", "踩雷", "别选", "不要", "后悔", "劝退", "注意", "雷", "骗", "坑钱"];
const MAX_UPGRADE_HINT = "同一条回复只能升级一次，每人每天最多 5 篇";

interface UpgradeReplyButtonProps {
  replyId: string;
  questionId: string;
  replyContent: string;
  questionTitle: string;
  scenarioType: string;
}

function pickPostType(content: string): "experience" | "avoid" {
  return AVOID_HINTS.some((k) => content.includes(k)) ? "avoid" : "experience";
}

function firstSentence(content: string): string {
  const t = content.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const head = t.split(/[。！？!?；;，,\n]/).find((p) => p.trim().length > 0)?.trim() || t;
  return head.slice(0, 42);
}

function titleCandidates(content: string, questionTitle: string, postType: string): string[] {
  const sent = firstSentence(content) || "我的真实经验";
  const tag = postType === "avoid" ? "避雷" : "经验";
  const base = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);
  return [
    sent,
    `关于《${questionTitle}》的${tag}分享：${base(sent, 14)}`,
    `${postType === "avoid" ? "别踩这些坑" : "最真实有用的细节"}｜${base(sent, 18)}`,
  ];
}

/** 回复升级为帖子（抖音式"评论一键发布为作品"的轻量版，蓝图 v4.6 §8.16） */
export function UpgradeReplyButton({
  replyId,
  questionId,
  replyContent,
  questionTitle,
  scenarioType,
}: UpgradeReplyButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [postType, setPostType] = useState<"experience" | "avoid">("experience");
  const [title, setTitle] = useState("");
  const [titleIdx, setTitleIdx] = useState(0);
  const [titleTouched, setTitleTouched] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openPanel() {
    const type = pickPostType(replyContent);
    const candidates = titleCandidates(replyContent, questionTitle, type);
    setPostType(type);
    setTitle(candidates[0]);
    setTitleIdx(0);
    setTitleTouched(false);
    setContent(replyContent);
    setImages([]);
    setError("");
    setOpen(true);
  }

  function cycleTitle() {
    const candidates = titleCandidates(content || replyContent, questionTitle, postType);
    const next = (titleIdx + 1) % candidates.length;
    setTitleIdx(next);
    setTitle(candidates[next]);
    setTitleTouched(true);
  }

  function changeType(type: "experience" | "avoid") {
    setPostType(type);
    if (!titleTouched) {
      const candidates = titleCandidates(content || replyContent, questionTitle, type);
      setTitleIdx(0);
      setTitle(candidates[0]);
    }
  }

  async function submit() {
    if (busy) return;
    const t = title.trim();
    const c = content.trim();
    if (!t) {
      setError("请填写标题");
      return;
    }
    if (!c) {
      setError("请填写正文");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: t,
        content: c,
        postType,
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
    if (res.status === 401) {
      router.push("/login");
      return;
    }
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
        title="把这条回复一键升级为独立帖子（可配图、可分享），原回复仍保留"
        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 transition hover:text-accent"
      >
        <ArrowUpRight className="h-3 w-3" />
        升级为帖子
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="card max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-ink">把回复升级为帖子</h3>
                <p className="mt-0.5 text-xs text-zinc-400">抖音式「评论一键发布为作品」——你的回答也能变成一篇可沉淀、可分享的独立内容</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="text-zinc-400 transition hover:text-ink" title="关闭">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-xs text-zinc-500">
              <span className="font-medium text-zinc-600">来源回复</span>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{replyContent}</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">帖子类型</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => changeType("experience")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition",
                    postType === "experience" ? "border-blue-300 bg-blue-50 text-accent" : "border-line text-zinc-500 hover:bg-zinc-50"
                  )}
                >
                  经验帖
                  <span className="block text-xs font-normal text-zinc-400">分享真实就读 / 申请 / 求职经验</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeType("avoid")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition",
                    postType === "avoid" ? "border-red-300 bg-red-50 text-red-600" : "border-line text-zinc-500 hover:bg-zinc-50"
                  )}
                >
                  避雷帖
                  <span className="block text-xs font-normal text-zinc-400">提醒后来人避开踩过的坑</span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">标题（≤100 字）</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleTouched(true);
                  }}
                  maxLength={100}
                />
                <button
                  type="button"
                  onClick={cycleTitle}
                  title="换一个标题建议"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-3 text-xs text-zinc-500 transition hover:border-accent hover:text-accent"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  换标题
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">正文（≤3000 字，可继续补充细节）</label>
              <textarea
                className="input min-h-32"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={3000}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-600">配图（可选，自动压缩）</label>
              <ImageUploader images={images} onChange={setImages} />
            </div>

            <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-400">
              升级后：原回复仍保留在原问题下；本帖顶部会标注「由回复升级 · 转自原问题」回源。{MAX_UPGRADE_HINT}。
            </p>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-lg border border-line px-4 py-2 text-sm text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                发布为帖子
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
