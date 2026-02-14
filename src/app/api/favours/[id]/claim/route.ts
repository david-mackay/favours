import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { favours } from "@/server/db/schema";

export const runtime = "nodejs";

/**
 * POST /api/favours/:id/claim – claim a favour (volunteer to do it)
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

    // Get the favour
    const favour = await db.query.favours.findFirst({
      where: eq(favours.id, id),
    });

    if (!favour) {
      return NextResponse.json({ error: "Favour not found" }, { status: 404 });
    }

    if (favour.status !== "open") {
      return NextResponse.json(
        { error: "This favour is no longer open" },
        { status: 400 }
      );
    }

    if (favour.creatorWallet === user.walletAddress) {
      return NextResponse.json(
        { error: "Cannot claim your own favour" },
        { status: 400 }
      );
    }

    // Claim it
    const updated = await db
      .update(favours)
      .set({
        status: "claimed",
        claimerWallet: user.walletAddress,
        updatedAt: new Date(),
      })
      .where(and(eq(favours.id, id), eq(favours.status, "open")))
      .returning()
      .then((rows) => rows[0]);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to claim – may have been claimed by someone else" },
        { status: 409 }
      );
    }

    return NextResponse.json({ favour: updated, ok: true });
  } catch (error) {
    console.error("/api/favours/[id]/claim POST error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
