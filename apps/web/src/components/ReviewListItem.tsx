import { formatRelative, safeParse } from "@/lib/format";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ReportButton } from "@/components/ReportButton";
import { FoldedContent } from "@/components/FoldedContent";

interface ReviewListItemProps {
  id: string;
  content: string | null;
  status: string;
  degreeLevel: string | null;
  enrolledYear: number | null;
  isAlumni: boolean;
  createdAt: Date;
  author: { nickname: string; verifiedSchools: string; level: number };
}

/** 单条结构化评价：隐藏内容不展示，折叠内容默认收起，附举报入口。 */
export function ReviewListItem({
  id,
  content,
  status,
  degreeLevel,
  enrolledYear,
  isAlumni,
  createdAt,
  author,
}: ReviewListItemProps) {
  if (status === "hidden") return null;
  const schools = safeParse<string[]>(author.verifiedSchools, []);

  const body = (
    <article className="card p-4">
      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="font-medium text-zinc-600">{author.nickname}</span>
        <VerifiedBadge schools={schools} />
        <span>L{author.level}</span>
        <span>{degreeLevel === "master" ? "硕士" : "本科"}</span>
        {enrolledYear && <span>{enrolledYear} 级</span>}
        {isAlumni && <span className="text-accent">校友</span>}
        <span className="ml-auto">{formatRelative(createdAt)}</span>
        <ReportButton targetType="review" targetId={id} compact />
      </div>
      <p className="text-sm leading-relaxed text-ink">{content}</p>
    </article>
  );

  return status === "folded" ? <FoldedContent key={id}>{body}</FoldedContent> : <div key={id}>{body}</div>;
}
