import Link from "next/link";
import { SCENARIOS } from "@/lib/core";
import { cn } from "@/lib/format";

export function ScenarioTabs({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
      {SCENARIOS.map((item) => (
        <Link
          key={item.type}
          href={`/?scenario=${item.type}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition",
            current === item.type
              ? "bg-ink text-white"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-ink"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
