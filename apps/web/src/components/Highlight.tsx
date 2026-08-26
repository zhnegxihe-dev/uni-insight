import { Fragment, type ReactNode } from "react";

export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let index = lower.indexOf(needle);
  let key = 0;

  while (index !== -1) {
    if (index > cursor) {
      parts.push(<Fragment key={key++}>{text.slice(cursor, index)}</Fragment>);
    }
    parts.push(
      <mark key={key++} className="rounded bg-amber-100 px-0.5 text-ink">
        {text.slice(index, index + q.length)}
      </mark>
    );
    cursor = index + q.length;
    index = lower.indexOf(needle, cursor);
  }
  if (cursor < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(cursor)}</Fragment>);
  }
  return <>{parts}</>;
}
