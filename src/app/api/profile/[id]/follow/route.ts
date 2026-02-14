import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/auth/session";
import {
  followUser,
  unfollowUser,
  checkFollowStatus,
} from "@/server/tapestry";

export const runtime = "nodejs";

/**
 * POST /api/profile/:id/follow – follow a user
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await context.params;

    if (id === user.walletAddress) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    const result = await followUser(user.walletAddress, id);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("/api/profile/[id]/follow POST error", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/:id/follow – unfollow a user
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await context.params;

    const result = await unfollowUser(user.walletAddress, id);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("/api/profile/[id]/follow DELETE error", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/:id/follow – check if current user follows this user
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await context.params;
    const status = await checkFollowStatus(user.walletAddress, id);
    return NextResponse.json(status);
  } catch (error) {
    console.error("/api/profile/[id]/follow GET error", error);
    return NextResponse.json({ isFollowing: false });
  }
}
