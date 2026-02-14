import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { favours } from "@/server/db/schema";
import { getProfileInfoForWallet } from "@/server/tapestry";
import { canViewFavour } from "@/server/favour-visibility";

export const runtime = "nodejs";

/**
 * GET /api/favours – get favours feed
 * Query params:
 *   ?filter=all|mine|claimed – filter by type
 *   ?status=open|claimed|completed|cancelled
 *   ?limit=20&offset=0
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "all";
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const user = await getAuthenticatedUser();

    // Build query - mine and claimed bypass visibility (creator/claimer always sees own)
    let rows;
    if (filter === "mine" && user) {
      rows = await db.query.favours.findMany({
        where: status
          ? (f, { and, eq: eq_ }) =>
              and(
                eq_(f.creatorWallet, user.walletAddress),
                eq_(f.status, status)
              )
          : eq(favours.creatorWallet, user.walletAddress),
        orderBy: [desc(favours.createdAt)],
        limit,
        offset,
      });
    } else if (filter === "claimed" && user) {
      rows = await db.query.favours.findMany({
        where: eq(favours.claimerWallet, user.walletAddress),
        orderBy: [desc(favours.createdAt)],
        limit,
        offset,
      });
    } else {
      // All feed: fetch more than needed, filter by visibility, then slice
      const statusFilter = status ?? "open";
      const allRows = await db.query.favours.findMany({
        where: eq(favours.status, statusFilter),
        orderBy: [desc(favours.createdAt)],
        limit: Math.min(limit * 3, 100), // fetch extra to account for filtering
        offset: 0,
      });

      const viewerWallet = user?.walletAddress ?? null;
      const visible: typeof allRows = [];
      for (const row of allRows) {
        if (await canViewFavour(row, viewerWallet)) {
          visible.push(row);
          if (visible.length >= limit + offset) break;
        }
      }
      rows = visible.slice(offset, offset + limit);
    }

    // Enrich with profile info (username, image) from Tapestry
    const wallets = new Set<string>();
    for (const r of rows) {
      wallets.add(r.creatorWallet);
      if (r.claimerWallet) wallets.add(r.claimerWallet);
    }
    const profileMap = new Map<
      string,
      { username: string | null; image: string | null }
    >();
    await Promise.all(
      Array.from(wallets).map(async (w) => {
        const info = await getProfileInfoForWallet(w);
        profileMap.set(w, info);
      })
    );

    const favoursWithProfiles = rows.map((r) => {
      const creator = profileMap.get(r.creatorWallet);
      const claimer = r.claimerWallet
        ? profileMap.get(r.claimerWallet)
        : undefined;
      return {
        ...r,
        creatorUsername: creator?.username ?? null,
        creatorImage: creator?.image ?? null,
        claimerUsername: claimer?.username ?? null,
        claimerImage: claimer?.image ?? null,
      };
    });

    return NextResponse.json({ favours: favoursWithProfiles });
  } catch (error) {
    console.error("/api/favours GET error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favours – create a new favour/bounty
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = (await req.json()) as {
      title?: string;
      description?: string;
      bountyAmount?: string | number;
      bountyToken?: string;
      category?: string;
      expiresAt?: string;
      visibility?: "public" | "followers" | "close";
      allowedViewers?: string[];
    };

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const bountyAmount = parseFloat(String(body.bountyAmount ?? "0"));
    if (isNaN(bountyAmount) || bountyAmount <= 0) {
      return NextResponse.json(
        { error: "Bounty amount must be greater than 0" },
        { status: 400 }
      );
    }

    const visibility = body.visibility ?? "public";
    if (!["public", "followers", "close"].includes(visibility)) {
      return NextResponse.json(
        { error: "Invalid visibility" },
        { status: 400 }
      );
    }

    let allowedViewers: string | null = null;
    if (visibility === "close" && Array.isArray(body.allowedViewers)) {
      const valid = body.allowedViewers.filter(
        (v): v is string => typeof v === "string" && v.trim().length > 0
      );
      if (valid.length > 0) {
        allowedViewers = JSON.stringify(valid);
      }
    }

    const created = await db
      .insert(favours)
      .values({
        creatorWallet: user.walletAddress,
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        bountyAmount: String(bountyAmount),
        bountyToken: body.bountyToken ?? "USDC",
        category: body.category ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        visibility,
        allowedViewers,
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json({ favour: created }, { status: 201 });
  } catch (error) {
    console.error("/api/favours POST error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
