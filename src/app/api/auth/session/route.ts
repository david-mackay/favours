import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import {
  getAuthenticatedUser,
  createSessionToken,
  setSessionCookie,
} from "@/server/auth/session";
import { verifySignature } from "@/server/auth/siws";
import { db } from "@/server/db";
import { authNonces } from "@/server/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({ authenticated: true, user });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      walletAddress?: string;
      signature?: string;
      nonce?: string;
    };

    const { walletAddress, signature, nonce } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Missing walletAddress" },
        { status: 400 }
      );
    }

    if (!signature || typeof signature !== "string") {
      return NextResponse.json(
        { error: "Missing signature. Please sign the message in your wallet." },
        { status: 400 }
      );
    }

    if (!nonce || typeof nonce !== "string") {
      return NextResponse.json(
        { error: "Missing nonce. Please request a new sign-in." },
        { status: 400 }
      );
    }

    // Look up the nonce
    const nonceRecord = await db.query.authNonces.findFirst({
      where: and(
        eq(authNonces.nonce, nonce),
        eq(authNonces.walletAddress, walletAddress)
      ),
    });

    if (!nonceRecord) {
      return NextResponse.json(
        { error: "Invalid or expired nonce. Please try signing in again." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(nonceRecord.expiresAt)) {
      await db.delete(authNonces).where(eq(authNonces.id, nonceRecord.id));
      return NextResponse.json(
        { error: "Nonce expired. Please try signing in again." },
        { status: 400 }
      );
    }

    // Verify the signature proves ownership of the wallet
    if (!verifySignature(nonceRecord.message, signature, walletAddress)) {
      return NextResponse.json(
        { error: "Invalid signature. You must sign the message with your wallet." },
        { status: 401 }
      );
    }

    // One-time use: delete the nonce
    await db.delete(authNonces).where(eq(authNonces.id, nonceRecord.id));

    const token = createSessionToken(walletAddress);
    const response = NextResponse.json({
      ok: true,
      user: { id: walletAddress, walletAddress },
    });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("/api/auth/session POST error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
