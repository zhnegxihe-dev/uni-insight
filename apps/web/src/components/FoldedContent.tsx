"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FoldedContentProps {
  children: React.ReactNode;
  reason?: string;
}

/** 被举报折叠的内容：默认隐藏，点击展开查看。 */
export function FoldedContent({ children, reason = "该内容因多次举报已被折叠，将进入人工审核" }: FoldedContentProps) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-amber-700">{reason}</p>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
          >
            <Eye className="h-3.5 w-3.5" />
            展开查看
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs text-amber-600">已展开被折叠内容（仍在审核中）</p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-zinc-400 transition hover:text-zinc-600"
        >
          <EyeOff className="h-3.5 w-3.5" />
          收起
        </button>
      </div>
      {children}
    </div>
  );
}
