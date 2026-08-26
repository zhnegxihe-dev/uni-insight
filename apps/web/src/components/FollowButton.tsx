"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/format";

interface FollowButtonProps {
  userId: string;
  following: boolean;
  followers: number;
}

export function FollowButton({ userId, following, followers }: FollowButtonProps) {
  const [on, setOn] = useState(following);
  const [count, setCount] = useState(followers);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setOn(data.following);
      setCount((c) => Math.max(0, c + (data.following ? 1 : -1)));
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={cn(
        "rounded-md px-3.5 py-1.5 text-sm font-medium transition",
        on
          ? "border border-line bg-white text-zinc-600 hover:bg-zinc-50"
          : "bg-accent text-white hover:bg-blue-700"
      )}
    >
      {on ? "已关注" : "关注"}
      <span className="ml-1 opacity-70">{count}</span>
    </button>
  );
}
