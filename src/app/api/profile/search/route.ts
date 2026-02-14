import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/auth/session";
import { searchProfiles } from "@/server/tapestry";

export const runtime = "nodejs";

/**
 * GET /api/profile/search?q=username – search profiles by username or id
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q");
    if (!q || q.trim().length < 2) {
      return NextResponse.json({ profiles: [] });
    }

    const result = await searchProfiles(q.trim(), 20);
    return NextResponse.json(result);
  } catch (error) {
    console.error("/api/profile/search GET error", error);
    return NextResponse.json({ profiles: [], error: "Search failed" });
  }
}
