import { averageRatings } from "@/lib/reviews";

interface RatingBarsProps {
  reviews: { ratings: string }[];
  dims: { key: string; label: string }[];
}

export function RatingBars({ reviews, dims }: RatingBarsProps) {
  const rows = averageRatings(reviews, dims);
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-zinc-600">{row.label}</span>
            <span className="font-medium text-ink">
              {row.avg === null ? "样本不足" : `${row.avg} / 5`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${((row.avg ?? 0) / 5) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
