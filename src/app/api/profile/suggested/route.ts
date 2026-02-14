import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/auth/session";
import { getProfile, getFollowersCount } from "@/server/tapestry";
import { SUGGESTED_USER_IDS } from "@/data/suggested-users";

export const runtime = "nodejs";

/**
 * GET /api/profile/suggested – get suggested user profiles for the Friends page
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const ids = SUGGESTED_USER_IDS.filter((id) => id.trim());
    if (ids.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const profileData = await getProfile(id);
          const profile = profileData?.profile as
            | { id?: string; username?: string; bio?: string; image?: string }
            | undefined;

          if (!profile?.username) return null;

          const followers = await getFollowersCount(id).catch(() => ({
            count: 0,
          }));

          return {
            id: profile.id ?? id,
            username: profile.username ?? "Anonymous",
            bio: profile.bio ?? null,
            image: profile.image ?? null,
            walletAddress: id,
            followers: followers?.count ?? 0,
          };
        } catch {
          return null;
        }
      })
    );

    const profiles = results.filter((p): p is NonNullable<typeof p> => p != null);

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("/api/profile/suggested GET error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
