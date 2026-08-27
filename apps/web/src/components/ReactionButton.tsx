"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/format";

interface ReactionButtonProps {
  endpoint: string;
  count: number;
  active: boolean;
  label: string;
  icon: LucideIcon;
  activeClass: string;
  activeIconClass: string;
  idleIconClass?: string;
}

/** 通用互动按钮（点赞/收藏共用）：乐观更新 + 401 跳登录 + 服务端确认 */
export function ReactionButton({
  endpoint,
  count,
  active,
  label,
  icon: Icon,
  activeClass,
  activeIconClass,
  idleIconClass = "text-zinc-400",
}: ReactionButtonProps) {
  const [value, setValue] = useState(count);
  const [on, setOn] = useState(active);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (busy) return;
    const next = !on;
    setOn(next);
    setValue((v) => Math.max(0, v + (next ? 1 : -1)));
    setBusy(true);
    const res = await fetch(endpoint, { method: "POST" });
    if (res.status === 401) {
      setOn(!next);
      setValue(count);
      router.push("/login");
      setBusy(false);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setValue(data.count);
      setOn(data.active);
      router.refresh();
    } else {
      setOn(!next);
      setValue(count);
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-all duration-150 active:scale-90",
        on ? activeClass : "text-zinc-500 hover:bg-zinc-50 hover:text-ink"
      )}
      title={label}
      aria-pressed={on}
    >
      <Icon
        className={cn(
          "h-4 w-4 transition-all duration-150",
          on ? `scale-110 ${activeIconClass}` : idleIconClass
        )}
      />
      {value}
    </button>
  );
}