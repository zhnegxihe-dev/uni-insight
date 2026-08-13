import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ schools }: { schools: string[] }) {
  if (schools.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-accent">
      <BadgeCheck className="h-3.5 w-3.5" />
      {schools[0]}
    </span>
  );
}
