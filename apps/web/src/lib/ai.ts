export interface SummaryPayload {
  overview: string;
  curriculum_insight: string;
  strengths: string[];
  weaknesses: string[];
  job_prospect: string;
  industry_outlook: string;
  advisor_insight: string;
  advice: string;
  disagreements: string[];
  confidence: "high" | "medium" | "low";
  sample_note: string;
}

interface AiReplyInput {
  content: string;
  starCount: number;
  nickname: string;
  verified: boolean;
}

export async function generateSummary(
  questionTitle: string,
  replies: AiReplyInput[]
): Promise<SummaryPayload> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return buildOfflineSummary(questionTitle, replies);

  try {
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const prompt = [
      "你是升学信息聚合助手。请基于以下真实学生回复生成结构化总结。",
      `问题：${questionTitle}`,
      "回复（star 数和是否认证用户已标注）：",
      ...replies.map((r) => `- [${r.verified ? "认证" : "未认证"}][star ${r.starCount}] ${r.content}`),
      "只基于以上内容，不引入外部知识；忽略疑似广告内容；输出严格 JSON：",
      '{"overview":"...","curriculum_insight":"...","strengths":["..."],"weaknesses":["..."],"job_prospect":"...","industry_outlook":"...","advisor_insight":"...","advice":"...","disagreements":["..."],"confidence":"high|medium|low","sample_note":"..."}',
    ].join("\n");

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`LLM request failed: ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty LLM response");
    const parsed = JSON.parse(content) as Partial<SummaryPayload>;
    return normalizeSummary(parsed, replies.length);
  } catch {
    return buildOfflineSummary(questionTitle, replies);
  }
}

export function buildOfflineSummary(questionTitle: string, replies: AiReplyInput[]): SummaryPayload {
  const sorted = [...replies].sort((a, b) => b.starCount - a.starCount);
  const top = sorted.slice(0, 3);
  const first = top[0]?.content ?? "";
  const second = top[1]?.content ?? "";
  const overview = first ? `${first.slice(0, 70)}${first.length > 70 ? "…" : ""}` : "暂无足够回复生成摘要";
  const curriculum = sorted.find((r) => /课程|大一|大二|大三|计量|微宏观/i.test(r.content))?.content ?? "";
  const job = sorted.find((r) => /就业|毕业|银行|券商|咨询|考公/i.test(r.content))?.content ?? "";
  const industry = sorted.find((r) => /行业|内卷|互联网|金融/i.test(r.content))?.content ?? "";
  const advisor = sorted.find((r) => /导师|课题组|push/i.test(r.content))?.content ?? "";
  const advice = sorted.find((r) => /建议|实习|准备/i.test(r.content))?.content ?? "";

  return {
    overview,
    curriculum_insight: curriculum ? `${curriculum.slice(0, 90)}${curriculum.length > 90 ? "…" : ""}` : "暂无课程相关回复",
    strengths: [second ? `${second.slice(0, 60)}…` : "暂无", first ? `${first.slice(0, 60)}…` : "暂无"],
    weaknesses: sorted.filter((r) => /难|卷|累|门槛/.test(r.content)).slice(0, 2).map((r) => `${r.content.slice(0, 60)}…`),
    job_prospect: job ? `${job.slice(0, 90)}${job.length > 90 ? "…" : ""}` : "暂无就业相关回复",
    industry_outlook: industry ? `${industry.slice(0, 90)}${industry.length > 90 ? "…" : ""}` : "暂无行业相关回复",
    advisor_insight: advisor ? `${advisor.slice(0, 90)}${advisor.length > 90 ? "…" : ""}` : "",
    advice: advice ? `${advice.slice(0, 90)}${advice.length > 90 ? "…" : ""}` : "建议结合多个认证用户的回复综合判断",
    disagreements: [],
    confidence: "low",
    sample_note: `基于 ${replies.length} 条回复生成（离线演示模板，未连接 LLM）`,
  };
}

function normalizeSummary(parsed: Partial<SummaryPayload>, count: number): SummaryPayload {
  const fallback = buildOfflineSummary("", []);
  return {
    overview: parsed.overview || fallback.overview,
    curriculum_insight: parsed.curriculum_insight || fallback.curriculum_insight,
    strengths: parsed.strengths?.length ? parsed.strengths.slice(0, 3) : [],
    weaknesses: parsed.weaknesses?.length ? parsed.weaknesses.slice(0, 3) : [],
    job_prospect: parsed.job_prospect || "",
    industry_outlook: parsed.industry_outlook || "",
    advisor_insight: parsed.advisor_insight || "",
    advice: parsed.advice || "",
    disagreements: parsed.disagreements || [],
    confidence: parsed.confidence || "low",
    sample_note: parsed.sample_note || `基于 ${count} 条回复生成`,
  };
}
