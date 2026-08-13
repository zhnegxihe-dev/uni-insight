import { AskForm } from "@/components/AskForm";

export const metadata = { title: "发布问题 - UniInsight" };

export default function AskPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">发布问题</h1>
        <p className="mt-1 text-sm text-zinc-500">选择决策场景，让学长学姐更准确地回答你</p>
      </div>
      <div className="card p-6">
        <AskForm />
      </div>
    </div>
  );
}
