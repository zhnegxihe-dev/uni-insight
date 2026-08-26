import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommend";

export async function GET() {
  const user = await getSessionUser();
  const limit = 6;

  if (!user) {
    return NextResponse.json({
      ok: true,
      hasProfile: false,
      recommendations: [],
      reason: null,
    });
  }

  const { items, hasProfile, reason } = await getRecommendations(user.id, limit);
  return NextResponse.json({
    ok: true,
    hasProfile,
    reason,
    recommendations: items.map(({ question, score }) => ({ question, score })),
  });
}
