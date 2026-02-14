import { NextRequest, NextResponse } from "next/server";
import { getFollowing } from "@/server/tapestry";

export const runtime = "nodejs";

/**
 * GET /api/profile/:id/following – get a user's following list
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

    const following = await getFollowing(id, limit, offset);
    return NextResponse.json(following);
  } catch (error) {
    console.error("/api/profile/[id]/following GET error", error);
    return NextResponse.json({
      users: [],
      error: "Failed to fetch following list",
    });
  }
}
