"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImageDown, Share2, X } from "lucide-react";
import { cn } from "@/lib/format";

interface ShareCardButtonProps {
  id: string;
  kind: "post" | "question";
  title: string;
  content: string;
  typeLabel?: string;
  authorName: string;
  authorBadge?: string;
  sourceText?: string | null;
  accent?: "blue" | "red" | "violet";
  buttonClassName?: string;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ch === "\n") {
      lines.push(line);
      line = "";
      continue;
    }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const ACCENTS: Record<string, string> = { blue: "#2563eb", red: "#dc2626", violet: "#7c3aed" };

/** 分享卡片：一键生成可保存/转发的图文卡片（蓝图 v4.6 §8.16 Phase B-P4） */
export function ShareCardButton({
  id,
  kind,
  title,
  content,
  typeLabel,
  authorName,
  authorBadge,
  sourceText,
  accent = "blue",
  buttonClassName,
}: ShareCardButtonProps) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const color = ACCENTS[accent] ?? ACCENTS.blue;

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 720;
    const H = 960;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    // 背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hexToRgba(color, 0.06);
    ctx.fillRect(0, 0, W, 10);

    // 顶部品牌
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(64, 92, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("问", 64, 101);
    ctx.textAlign = "left";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("UniInsight · 升学问问", 108, 101);

    // 类型标签
    if (typeLabel) {
      ctx.fillStyle = hexToRgba(color, 0.12);
      roundRect(ctx, 48, 132, 24 + ctx.measureText(typeLabel).width + 8, 36, 18);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = "600 22px sans-serif";
      ctx.fillText(typeLabel, 56, 158);
    }

    // 标题
    ctx.fillStyle = "#111827";
    ctx.font = "bold 34px sans-serif";
    let y = 232;
    for (const line of wrapText(ctx, title, W - 96).slice(0, 5)) {
      ctx.fillText(line, 48, y);
      y += 48;
    }

    // 正文摘要
    ctx.fillStyle = "#52525b";
    ctx.font = "26px sans-serif";
    y += 14;
    const bodyLines = wrapText(ctx, content.replace(/\s+/g, " ").slice(0, 420), W - 96).slice(0, 16);
    for (const line of bodyLines) {
      ctx.fillText(line, 48, y);
      y += 40;
    }
    if (bodyLines.length >= 16) {
      ctx.fillText("…", 48, y);
    }

    // 来源条
    if (sourceText) {
      y = H - 150;
      ctx.fillStyle = "#f4f4f5";
      roundRect(ctx, 48, y - 34, W - 96, 68, 12);
      ctx.fill();
      ctx.fillStyle = "#71717a";
      ctx.font = "22px sans-serif";
      const srcLines = wrapText(ctx, sourceText, W - 128).slice(0, 2);
      for (const line of srcLines) {
        ctx.fillText(line, 64, y + (srcLines.length === 1 ? 0 : -8));
        y += 30;
      }
    }

    // 底部作者与品牌
    const footerY = H - 72;
    ctx.fillStyle = "#111827";
    ctx.font = "600 26px sans-serif";
    ctx.fillText(`@${authorName}`, 48, footerY);
    if (authorBadge) {
      ctx.fillStyle = color;
      ctx.font = "20px sans-serif";
      const bw = ctx.measureText(authorBadge).width + 16;
      roundRect(ctx, 56 + ctx.measureText(`@${authorName}`).width + 8, footerY - 24, bw, 32, 16);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(authorBadge, 60 + ctx.measureText(`@${authorName}`).width + 16, footerY - 1);
    }
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("真实经验，帮助后来人", W - 48, footerY);
    ctx.textAlign = "left";
  }, [open, title, content, typeLabel, authorName, authorBadge, sourceText, color]);

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `uni-insight-${kind}-${id}.png`;
    a.click();
  }

  async function copyText() {
    const url = `${window.location.origin}/${kind === "post" ? "posts" : "question"}/${id}`;
    try {
      await navigator.clipboard.writeText(`${title}\n${url}`);
      alert("链接已复制");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="生成一张可保存/转发的分享卡片"
        className={cn("inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-zinc-500 transition hover:border-accent hover:text-accent", buttonClassName)}
      >
        <ImageDown className="h-3.5 w-3.5" />
        分享卡片
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md space-y-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">分享卡片</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 transition hover:text-ink" title="关闭">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <canvas ref={canvasRef} className="block h-auto w-full" style={{ aspectRatio: "720 / 960" }} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={download} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
                <Download className="h-4 w-4" />
                保存图片
              </button>
              <button type="button" onClick={copyText} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50">
                <Share2 className="h-4 w-4" />
                复制链接
              </button>
            </div>
            <p className="text-xs text-zinc-400">保存后可直接发到微信 / 朋友圈 / 小红书；卡片底部可手写补充内容。</p>
          </div>
        </div>
      )}
    </>
  );
}
