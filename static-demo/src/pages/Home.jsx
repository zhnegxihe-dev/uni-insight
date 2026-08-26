import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDb } from "../store";
import * as db from "../db";
import { QuestionCard, ScenarioTabs } from "../components";

export default function Home() {
  const state = useDb();
  const [params, setParams] = useSearchParams();
  const scenario = params.get("scenario") ?? "all";
  const q = params.get("q") ?? "";

  const questions = db.getQuestions(state, { scenario, q });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">发现</h1>
        <p className="mt-1 text-sm text-zinc-500">真实学长学姐的经验，点亮 star 让好内容被看见</p>
      </div>

      <section>
        <ScenarioTabs
          current={scenario}
          onChange={(type) => {
            const next = new URLSearchParams(params);
            if (type === "all") next.delete("scenario");
            else next.set("scenario", type);
            setParams(next);
          }}
        />
        {q && <p className="mb-3 text-sm text-zinc-500">搜索“{q}”的结果</p>}
        {questions.length === 0 ? (
          <div className="card p-10 text-center text-sm text-zinc-400">
            {q ? "没有找到相关问题" : scenario === "all" ? "还没有相关问题，成为第一个提问的人" : "该场景下还没有问题"}
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} folded={question.status === "folded"} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
