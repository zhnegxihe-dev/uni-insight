import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDb } from "../store";
import * as db from "../db";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { QuestionCard, ScenarioTabs, ExperiencePostCard } from "../components";

export default function Home() {
  const state = useDb();
  const [params, setParams] = useSearchParams();
  const scenario = params.get("scenario") ?? "all";
  const q = params.get("q") ?? "";

  const questions = db.getQuestions(state, { scenario, q });
  const experiencePosts = db.getExperiencePosts(state, {}).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">发现</h1>
        <p className="mt-1 text-sm text-zinc-500">真实学长学姐的经验，点赞让好内容被看见，收藏留住有用信息</p>
      </div>

      {experiencePosts.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold text-ink">最新经验帖</h2>
            </div>
            <Link to="/posts" className="text-sm text-accent hover:underline">查看全部 →</Link>
          </div>
          <div className="space-y-3">
            {experiencePosts.map((post) => (
              <ExperiencePostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

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
