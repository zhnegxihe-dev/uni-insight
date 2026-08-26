import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ schools }: { schools: string[] }) {
  if (schools.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-accent" title="学校邮箱已认证">
      <BadgeCheck className="h-3.5 w-3.5" />
      {schools[0]} · 认证
    </span>
  );
}
