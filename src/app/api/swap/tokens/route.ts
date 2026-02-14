import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies Jupiter Tokens API v2 search.
 * Used by the dev token discovery modal to find token metadata (symbol, mint, decimals, icon).
 */
const JUPITER_TOKENS_BASE = "https://api.jup.ag/tokens/v2";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const headers: Record<string, string> = {};
  const apiKey = process.env.JUPITER_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const res = await fetch(
      `${JUPITER_TOKENS_BASE}/search?query=${encodeURIComponent(query.trim())}`,
      { headers }
    );
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message ?? "Token search failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Jupiter token search error:", e);
    return NextResponse.json(
      { error: "Token search failed" },
      { status: 500 }
    );
  }
}
