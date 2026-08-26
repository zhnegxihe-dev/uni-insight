import { GraduationCap } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-5" aria-busy="true">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 animate-pulse items-center justify-center rounded-lg bg-zinc-100 text-zinc-300">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div className="space-y-1.5">
          <div className="h-4 w-36 animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="card space-y-3 p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
            <div className="flex gap-2 pt-1">
              <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-100" />
              <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card space-y-2.5 p-5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-14 animate-pulse rounded bg-blue-50" />
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            <div className="flex gap-2">
              <div className="h-5 w-14 animate-pulse rounded-md bg-zinc-100" />
              <div className="h-5 w-14 animate-pulse rounded-md bg-zinc-100" />
              <div className="h-5 w-14 animate-pulse rounded-md bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
