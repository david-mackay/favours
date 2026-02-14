import { NextRequest, NextResponse } from "next/server";

const JUPITER_ULTRA_BASE = "https://api.jup.ag/ultra/v1";

export async function POST(request: NextRequest) {
  let body: { signedTransaction?: string; requestId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { signedTransaction, requestId } = body;

  if (!signedTransaction || !requestId) {
    return NextResponse.json(
      { error: "signedTransaction and requestId are required" },
      { status: 400 }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = process.env.JUPITER_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const res = await fetch(`${JUPITER_ULTRA_BASE}/execute`, {
      method: "POST",
      headers,
      body: JSON.stringify({ signedTransaction, requestId }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Swap execution failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Jupiter Ultra execute error:", e);
    return NextResponse.json(
      { error: "Failed to execute swap" },
      { status: 500 }
    );
  }
}
