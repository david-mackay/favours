import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { authNonces } from "@/server/db/schema";
import {
  generateNonce,
  buildSignMessage,
  getNonceExpiry,
} from "@/server/auth/siws";

export const runtime = "nodejs";

/**
 * POST /api/auth/nonce – get a nonce and message to sign for SIWS
 * Body: { walletAddress: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { walletAddress?: string };

    if (
      !body.walletAddress ||
      typeof body.walletAddress !== "string" ||
      body.walletAddress.length < 32
    ) {
      return NextResponse.json(
        { error: "Valid walletAddress is required" },
        { status: 400 }
      );
    }

    const walletAddress = body.walletAddress.trim();
    const nonce = generateNonce();
    const issuedAt = new Date().toISOString();
    const message = buildSignMessage(nonce, issuedAt);
    const expiresAt = getNonceExpiry();

    await db.insert(authNonces).values({
      walletAddress,
      nonce,
      message,
      expiresAt,
    });

    return NextResponse.json({ nonce, message });
  } catch (error) {
    console.error("/api/auth/nonce POST error", error);
    return NextResponse.json(
      { error: "Failed to create nonce" },
      { status: 500 }
    );
  }
}
