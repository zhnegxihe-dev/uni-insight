import { LEVELS, STAR_RULES } from "@uni-insight/core";

export const metadata = { title: "Star 等级 - UniInsight" };

export default function LevelsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Star 评分与等级</h1>
        <p className="mt-1 text-sm text-zinc-500">点亮 star，让真实经验获得应有的认可</p>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">计分公式</h2>
        <div className="card divide-y divide-line">
          {STAR_RULES.map((rule) => (
            <div key={rule.key} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-zinc-600">{rule.label}</span>
              <span className={`font-medium ${rule.weight > 0 ? "text-accent" : "text-red-500"}`}>
                {rule.weight > 0 ? `+${rule.weight}` : rule.weight}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">等级奖励</h2>
        <div className="card divide-y divide-line">
          {LEVELS.map((level) => (
            <div key={level.level} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[160px_1fr] sm:gap-4">
              <div>
                <span className="font-semibold text-ink">{level.name}</span>
                <span className="ml-2 text-xs text-zinc-400">≥ {level.min} 分</span>
              </div>
              <p className="text-zinc-600">{level.reward}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
