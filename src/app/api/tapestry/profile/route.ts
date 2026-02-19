import { NextRequest, NextResponse } from "next/server";
import { getProfileInfoForWallet } from "@/server/tapestry";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet param required" }, { status: 400 });
  }

  const { username, image } = await getProfileInfoForWallet(wallet);
  return NextResponse.json({ username, image });
}
