import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { parseSearchQuery, recordAction, rebuildUserProfile } from "@/lib/recommend";

/** 新用户搜索引导：解析搜索词并写入画像种子（权重 1.5，主动意图最高） */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const query = String(body.query ?? "").trim().slice(0, 100);
  if (!query) return NextResponse.json({ error: "请先输入你想了解的内容" }, { status: 400 });

  const tags = await parseSearchQuery(query);
  await recordAction(user.id, { actionType: "search", targetType: "bootstrap", tags });
  await rebuildUserProfile(user.id);

  return NextResponse.json({ ok: true, tags, message: "已根据你的兴趣生成推荐" });
}
