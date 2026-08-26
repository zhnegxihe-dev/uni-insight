import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDb, act } from "../store";
import * as db from "../db";

export default function Ask() {
  const state = useDb();
  const navigate = useNavigate();
  const user = db.getCurrentUser(state);
  const [scenario, setScenario] = useState("gaokao");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [meta, setMeta] = useState({});
  const [error, setError] = useState("");

  const fields = db.SCENARIO_FIELDS[scenario] ?? [];

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const tagNames = tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean).slice(0, 5);
      const question = act(db.createQuestion, {
        title: title.trim(),
        description: description.trim() || null,
        scenarioType: scenario,
        scenarioMeta: meta,
        degreeLevel: "bachelor",
        tagNames,
      });
      navigate(`/question/${question.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="text-sm text-zinc-500">请先登录后提问</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-xl font-semibold text-ink">发布问题</h1>
      <form onSubmit={submit} className="card space-y-5 p-6">
        <div>
          <label className="label">决策场景</label>
          <select className="input" value={scenario} onChange={(e) => { setScenario(e.target.value); setMeta({}); }}>
            {db.SCENARIOS.filter((s) => s.type !== "all").map((s) => (
              <option key={s.type} value={s.type}>{s.label}</option>
            ))}
          </select>
        </div>

        {fields.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="label">{field.label}</label>
                <input
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
          <label className="label">标题（≤150 字）</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 150))} required placeholder="例如：中山大学经济系到底怎么样？" />
        </div>
        <div>
          <label className="label">补充描述（可选，≤300 字）</label>
          <textarea className="input min-h-[80px] resize-y" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} placeholder="补充背景信息" />
        </div>
        <div>
          <label className="label">标签（可选，逗号分隔，最多 5 个）</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="如：中山大学, 经济学, 本科" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={!title.trim()} className="btn-primary w-full">发布问题</button>
      </form>
    </div>
  );
}
