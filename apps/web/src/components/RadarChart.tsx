"use client";

interface RadarChartProps {
  labels: string[];
  series: { label: string; color: string; values: number[] }[];
}

export function RadarChart({ labels, series }: RadarChartProps) {
  const dims = labels.length;
  if (dims === 0 || series.length === 0) return null;

  const cx = 160;
  const cy = 145;
  const radius = 86;
  const angle = (index: number) => (Math.PI * 2 * index) / dims - Math.PI / 2;
  const point = (index: number, value: number) => {
    const r = (radius * Math.max(0, Math.min(5, value))) / 5;
    return [cx + r * Math.cos(angle(index)), cy + r * Math.sin(angle(index))] as const;
  };
  const polygon = (values: number[]) => values.map((value, index) => point(index, value).join(",")).join(" ");

  return (
    <div>
      <svg viewBox="0 0 320 290" className="mx-auto w-full max-w-[360px]">
        {[1, 2, 3, 4, 5].map((ring) => (
          <polygon
            key={ring}
            points={labels.map((_, index) => point(index, ring).join(",")).join(" ")}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        {labels.map((label, index) => {
          const [x, y] = point(index, 5);
          const lx = cx + (radius + 26) * Math.cos(angle(index));
          const ly = cy + (radius + 26) * Math.sin(angle(index));
          return (
            <text
              key={label}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-zinc-500 text-[11px]"
            >
              {label}
            </text>
          );
        })}
        {labels.map((_, index) => {
          const [x, y] = point(index, 5);
          return <line key={index} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
        })}
        {series.map((item) => (
          <polygon
            key={item.label}
            points={polygon(item.values)}
            fill={item.color}
            fillOpacity="0.16"
            stroke={item.color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-3">
        {series.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
