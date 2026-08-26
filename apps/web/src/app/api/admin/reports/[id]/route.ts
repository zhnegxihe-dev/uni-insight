import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { resolveReport } from "@/lib/reports";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "无权访问管理后台" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action !== "resolve" && action !== "dismiss") {
    return NextResponse.json({ error: "操作不正确" }, { status: 400 });
  }

  const result = await resolveReport(id, action === "resolve");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({
    ok: true,
    message: action === "resolve" ? "已确认违规：内容已隐藏，作者扣分，举报者已奖励" : "已驳回举报：举报者扣 10 分",
  });
}
