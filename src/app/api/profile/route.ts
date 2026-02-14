import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/auth/session";
import {
  findOrCreateProfile,
  updateProfile,
  getProfile,
  getFollowersCount,
  getFollowingCount,
} from "@/server/tapestry";

export const runtime = "nodejs";

/**
 * GET /api/profile – get the current user's Tapestry profile
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    try {
      const profile = await getProfile(user.walletAddress);
      const hasProfile = profile?.profile != null;

      if (!hasProfile) {
        return NextResponse.json({
          profile: null,
          socialCounts: { followers: 0, following: 0 },
          needsSetup: true,
        });
      }

      const [followers, following] = await Promise.all([
        getFollowersCount(user.walletAddress).catch(() => ({ count: 0 })),
        getFollowingCount(user.walletAddress).catch(() => ({ count: 0 })),
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
    } catch {
      // Profile fetch failed (e.g. network error)
      return NextResponse.json({
        profile: null,
        socialCounts: { followers: 0, following: 0 },
        needsSetup: true,
      });
    }
  } catch (error) {
    console.error("/api/profile GET error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/profile – create/update the current user's Tapestry profile
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = (await req.json()) as {
      username?: string;
      bio?: string;
      image?: string;
    };

    if (!body.username || typeof body.username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    const username = body.username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 },
      );
    }

    const existing = await getProfile(user.walletAddress).catch(() => null);
    const hasProfile = existing?.profile != null;

    if (hasProfile) {
      const result = await updateProfile(user.walletAddress, {
        username,
        bio: body.bio,
        image: body.image,
      });
      return NextResponse.json({ profile: result, ok: true });
    }

    const result = await findOrCreateProfile({
      walletAddress: user.walletAddress,
      username,
      bio: body.bio,
      image: body.image,
    });

    return NextResponse.json({ profile: result, ok: true });
  } catch (error) {
    console.error("/api/profile POST error", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 },
    );
  }
}
