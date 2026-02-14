import { NextRequest, NextResponse } from "next/server";

/**
 * Jupiter Ultra Swap API with referral fees.
 * Env: JUPITER_API_KEY (optional, from portal.jup.ag),
 *      JUPITER_REFERRAL_ACCOUNT (wallet for fees),
 *      JUPITER_REFERRAL_FEE (50-255 bps).
 */
const JUPITER_ULTRA_BASE = "https://api.jup.ag/ultra/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const inputMint =
    searchParams.get("inputMint") ??
    "So11111111111111111111111111111111111111112";
  const outputMint =
    searchParams.get("outputMint") ??
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const amount = searchParams.get("amount") ?? "10000000";
  const taker = searchParams.get("taker");
  const receiver = searchParams.get("receiver");

  if (!taker) {
    return NextResponse.json(
      { error: "taker (wallet address) is required" },
      { status: 400 }
    );
  }

  const referralAccount = process.env.JUPITER_REFERRAL_ACCOUNT;
  const referralFee = process.env.JUPITER_REFERRAL_FEE
    ? parseInt(process.env.JUPITER_REFERRAL_FEE, 10)
    : 50;

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    taker,
  });

  if (receiver) params.set("receiver", receiver);
  if (referralAccount) params.set("referralAccount", referralAccount);
  if (referralFee >= 50 && referralFee <= 255) {
    params.set("referralFee", String(referralFee));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = process.env.JUPITER_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const res = await fetch(`${JUPITER_ULTRA_BASE}/order?${params}`, {
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Failed to get swap quote" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Jupiter Ultra order error:", e);
    return NextResponse.json(
      { error: "Failed to fetch swap quote" },
      { status: 500 }
    );
  }
}
