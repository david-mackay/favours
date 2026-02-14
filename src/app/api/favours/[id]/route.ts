import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { favours } from "@/server/db/schema";
import { getProfileInfoForWallet } from "@/server/tapestry";

export const runtime = "nodejs";

/**
 * GET /api/favours/:id – get a single favour
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const favour = await db.query.favours.findFirst({
      where: eq(favours.id, id),
    });

    if (!favour) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [creatorInfo, claimerInfo] = await Promise.all([
      getProfileInfoForWallet(favour.creatorWallet),
      favour.claimerWallet
        ? getProfileInfoForWallet(favour.claimerWallet)
        : Promise.resolve({ username: null, image: null }),
    ]);

    return NextResponse.json({
      favour: {
        ...favour,
        creatorUsername: creatorInfo.username,
        creatorImage: creatorInfo.image,
        claimerUsername: claimerInfo.username,
        claimerImage: claimerInfo.image,
      },
    });
  } catch (error) {
    console.error("/api/favours/[id] GET error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/favours/:id – update a favour (only by creator)
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await req.json()) as {
      title?: string;
      description?: string;
      bountyAmount?: string | number;
      category?: string;
      status?: string;
    };

    // Only creator can update
    const existing = await db.query.favours.findFirst({
      where: and(eq(favours.id, id), eq(favours.creatorWallet, user.walletAddress)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title) updates.title = body.title.trim();
    if (body.description !== undefined)
      updates.description = body.description?.trim() ?? null;
    if (body.bountyAmount) {
      const amt = parseFloat(String(body.bountyAmount));
      if (!isNaN(amt) && amt > 0) updates.bountyAmount = String(amt);
    }
    if (body.category !== undefined) updates.category = body.category;
    if (body.status === "cancelled" && existing.status === "open") {
      updates.status = "cancelled";
    }

    const updated = await db
      .update(favours)
      .set(updates)
      .where(eq(favours.id, id))
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json({ favour: updated });
  } catch (error) {
    console.error("/api/favours/[id] PATCH error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favours/:id – delete a favour (only by creator, only if open)
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

    const deleted = await db
      .delete(favours)
      .where(
        and(
          eq(favours.id, id),
          eq(favours.creatorWallet, user.walletAddress),
          eq(favours.status, "open")
        )
      )
      .returning({ id: favours.id })
      .then((rows) => rows[0]);

    if (!deleted) {
      return NextResponse.json(
        { error: "Not found or cannot delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("/api/favours/[id] DELETE error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
