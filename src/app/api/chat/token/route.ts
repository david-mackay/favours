import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/auth/session";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const token = jwt.sign(
    { wallet_address: user.walletAddress },
    secret,
    { expiresIn: "24h" },
  );

  return NextResponse.json({ token });
}
