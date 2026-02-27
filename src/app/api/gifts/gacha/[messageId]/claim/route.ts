import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { messages, gachaNfts } from "@/server/db/schema";
import { getAuthenticatedUser } from "@/server/auth/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const msg = await db.query.messages.findFirst({
    where: and(
      eq(messages.id, messageId),
      eq(messages.type, "gift_gacha")
    ),
  });

  if (!msg) {
    return NextResponse.json({ error: "Gacha envelope not found" }, { status: 404 });
  }

  if (msg.receiverWallet !== user.walletAddress) {
    return NextResponse.json({ error: "Not your envelope" }, { status: 403 });
  }

  if (msg.isOpened) {
    // Already opened — return the NFT info
    let nft = null;
    if (msg.mintAddress) {
      nft = await db.query.gachaNfts.findFirst({
        where: eq(gachaNfts.messageId, messageId),
      });
    }
    return NextResponse.json({
      already: true,
      nft: nft
        ? { name: nft.name, imageUrl: nft.imageUrl, rarity: nft.rarity }
        : { name: "Mystery NFT", imageUrl: null, rarity: "common" },
    });
  }

  // Mark message as opened
  await db
    .update(messages)
    .set({ isOpened: true })
    .where(eq(messages.id, messageId));

  // Look up allocated NFT
  let nftData = { name: "Mystery NFT", imageUrl: null as string | null, rarity: "common" };
  try {
    const nft = await db.query.gachaNfts.findFirst({
      where: eq(gachaNfts.messageId, messageId),
    });
    if (nft) {
      nftData = { name: nft.name, imageUrl: nft.imageUrl, rarity: nft.rarity };
      // Mark NFT as claimed (actual cNFT transfer is deferred)
      await db
        .update(gachaNfts)
        .set({
          isClaimed: true,
          claimedByWallet: user.walletAddress,
          claimedAt: new Date(),
        })
        .where(eq(gachaNfts.id, nft.id));
    }
  } catch {
    // pool may not exist yet
  }

  return NextResponse.json({
    success: true,
    nft: nftData,
  });
}
