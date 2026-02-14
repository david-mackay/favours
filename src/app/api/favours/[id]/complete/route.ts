import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { favours } from "@/server/db/schema";

export const runtime = "nodejs";

/**
 * POST /api/favours/:id/complete – mark a favour as completed
 * Called after the creator has sent the bounty payment.
 * Body: { transactionSignature: string }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await req.json()) as { transactionSignature?: string };

    if (
      !body.transactionSignature ||
      typeof body.transactionSignature !== "string"
    ) {
      return NextResponse.json(
        { error: "Transaction signature is required" },
        { status: 400 }
      );
    }

    // Only the creator can mark as complete (they're the one paying)
    const favour = await db.query.favours.findFirst({
      where: and(
        eq(favours.id, id),
        eq(favours.creatorWallet, user.walletAddress)
      ),
    });

    if (!favour) {
      return NextResponse.json(
        { error: "Favour not found or not authorized" },
        { status: 404 }
      );
    }

    if (favour.status !== "claimed") {
      return NextResponse.json(
        { error: "Favour must be claimed before it can be completed" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(favours)
      .set({
        status: "completed",
        transactionSignature: body.transactionSignature,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(favours.id, id))
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json({ favour: updated, ok: true });
  } catch (error) {
    console.error("/api/favours/[id]/complete POST error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
