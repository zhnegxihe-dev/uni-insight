"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCENARIO_FIELDS, SCENARIOS } from "@/lib/core";

export function AskForm() {
  const router = useRouter();
  const [scenario, setScenario] = useState("gaokao");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("bachelor");
  const [tags, setTags] = useState("");
  const [meta, setMeta] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fields = SCENARIO_FIELDS[scenario as keyof typeof SCENARIO_FIELDS] ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError("");
    const tagNames = tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        scenarioType: scenario,
        scenarioMeta: meta,
        degreeLevel,
        tagNames,
      }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "发布失败");
      setBusy(false);
      return;
    }
    const data = await res.json();
    router.push(`/question/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label" htmlFor="ask-scenario">
          决策场景
        </label>
        <select
          id="ask-scenario"
          className="input"
          value={scenario}
          onChange={(e) => {
            setScenario(e.target.value);
            setMeta({});
          }}
        >
          {SCENARIOS.filter((s) => s.type !== "all").map((s) => (
            <option key={s.type} value={s.type}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {fields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="label" htmlFor={field.name}>
                {field.label}
              </label>
              <input
                id={field.name}
                className="input"
                value={meta[field.name] ?? ""}
                onChange={(e) => setMeta((prev) => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="label" htmlFor="ask-title">
          标题（≤150 字）
        </label>
        <input
          id="ask-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 150))}
          required
          placeholder="例如：中山大学经济系到底怎么样？课程学什么，就业如何？"
        />
      </div>

      <div>
        <label className="label" htmlFor="ask-desc">
          补充说明（≤300 字，可选）
        </label>
        <textarea
          id="ask-desc"
          className="input min-h-[96px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 300))}
          placeholder="说说你的分数/现状/具体困惑"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="ask-degree">
            学位层次
          </label>
          <select
            id="ask-degree"
            className="input"
            value={degreeLevel}
            onChange={(e) => setDegreeLevel(e.target.value)}
          >
            <option value="bachelor">本科</option>
            <option value="master">硕士</option>
            <option value="phd">博士</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ask-tags">
            标签（逗号分隔，最多 5 个）
          </label>
          <input
            id="ask-tags"
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如：中山大学, 经济学, 本科"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="btn-primary w-full transition-all duration-150 active:scale-[0.99] sm:w-auto"
      >
        {busy ? "发布中…" : "发布问题"}
      </button>
    </form>
  );
}
