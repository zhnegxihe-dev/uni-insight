"use client";

import { useEffect, useRef } from "react";

interface TrackViewProps {
  actionType: "view" | "search";
  targetType?: string;
  targetId?: string;
  tags?: string[];
}

/** 前端行为埋点：挂载后上报一次（浏览/搜索），静默失败不影响页面。 */
export function TrackView({ actionType, targetType, targetId, tags }: TrackViewProps) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType, targetType, targetId, tags: tags ?? [] }),
    }).catch(() => {
      /* 静默 */
    });
  }, [actionType, targetType, targetId, tags]);
  return null;
}
