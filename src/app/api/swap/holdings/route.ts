import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies Jupiter Ultra holdings (llm.txt: GET /ultra/v1/holdings/{address}).
 * Returns token balances including native SOL.
 */
const JUPITER_ULTRA_BASE = "https://api.jup.ag/ultra/v1";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json(
      { error: "address is required" },
      { status: 400 }
    );
  }

  const headers: Record<string, string> = {};
  const apiKey = process.env.JUPITER_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const res = await fetch(`${JUPITER_ULTRA_BASE}/holdings/${address}`, {
      headers,
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Failed to fetch holdings" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Jupiter holdings error:", e);
    return NextResponse.json(
      { error: "Failed to fetch holdings" },
      { status: 500 }
    );
  }
}
