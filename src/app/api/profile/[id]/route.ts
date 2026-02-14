import { NextRequest, NextResponse } from "next/server";
import {
  getProfile,
  getFollowersCount,
  getFollowingCount,
} from "@/server/tapestry";

export const runtime = "nodejs";

/**
 * GET /api/profile/:id – get a user's Tapestry profile by ID (wallet or username)
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const profile = await getProfile(id);
    const [followers, following] = await Promise.all([
      getFollowersCount(id).catch(() => ({ count: 0 })),
      getFollowingCount(id).catch(() => ({ count: 0 })),
    ]);

    return NextResponse.json({
      profile: profile?.profile ?? null,
      socialCounts: {
        ...(profile?.socialCounts && typeof profile.socialCounts === "object"
          ? profile.socialCounts
          : {}),
        followers: followers?.count ?? 0,
        following: following?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("/api/profile/[id] GET error", error);
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
}
