"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="退出登录"
      className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-zinc-500 hover:bg-zinc-50 hover:text-ink"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
