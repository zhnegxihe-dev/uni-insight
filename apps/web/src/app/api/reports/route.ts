import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createReport, REPORT_REASONS, type ReportTargetType } from "@/lib/reports";

const TARGET_TYPES: ReportTargetType[] = ["question", "reply", "review", "ai_post", "experience_post"];

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const targetType = String(body.targetType ?? "");
  const targetId = String(body.targetId ?? "");
  const reason = String(body.reason ?? "");
  const detail = body.detail ? String(body.detail).trim().slice(0, 200) : undefined;

  if (!TARGET_TYPES.includes(targetType as ReportTargetType)) {
    return NextResponse.json({ error: "举报对象类型不正确" }, { status: 400 });
  }
  if (!targetId) return NextResponse.json({ error: "缺少举报对象" }, { status: 400 });
  if (!REPORT_REASONS.some((r) => r.key === reason)) {
    return NextResponse.json({ error: "请选择举报原因" }, { status: 400 });
  }

  const result = await createReport({
    reporterId: user.id,
    targetType: targetType as ReportTargetType,
    targetId,
    reason: reason as (typeof REPORT_REASONS)[number]["key"],
    detail,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    folded: result.folded,
    message: result.folded ? "举报已提交，该内容因多次举报已被折叠，将进入人工审核" : "举报已提交，感谢你的反馈",
  });
}
