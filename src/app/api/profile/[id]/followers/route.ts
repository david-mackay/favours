import { NextRequest, NextResponse } from "next/server";
import { getFollowers } from "@/server/tapestry";

export const runtime = "nodejs";

/**
 * GET /api/profile/:id/followers – get a user's followers list
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const followers = await getFollowers(id, limit, offset);
    return NextResponse.json(followers);
  } catch (error) {
    console.error("/api/profile/[id]/followers GET error", error);
    return NextResponse.json({ users: [], error: "Failed to fetch followers" });
  }
}
