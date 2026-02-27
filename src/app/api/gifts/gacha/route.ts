import { NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { messages, gachaNfts } from "@/server/db/schema";
import { getAuthenticatedUser } from "@/server/auth/session";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { recipientWallet, transactionHash, feeTransactionHash, amount, content } = body;

  if (!recipientWallet || !transactionHash) {
    return NextResponse.json(
      { error: "recipientWallet and transactionHash are required" },
      { status: 400 }
    );
  }

  // Allocate a random unclaimed NFT from the pool (stub — returns null if pool is empty)
  let allocatedNft = null;
  try {
    const available = await db.query.gachaNfts.findFirst({
      where: and(
        eq(gachaNfts.isClaimed, false),
        isNull(gachaNfts.messageId)
      ),
    });
    if (available) {
      allocatedNft = available;
    }
  } catch {
    // pool may not exist yet
  }

  // Save the gacha message
  const [msg] = await db
    .insert(messages)
    .values({
      senderWallet: user.walletAddress,
      receiverWallet: recipientWallet,
      content: content ?? null,
      type: "gift_gacha",
      amount: amount?.toString() ?? null,
      transactionHash,
      mintAddress: allocatedNft?.mintAddress ?? null,
      tokenSymbol: "USDC",
      tokenName: "USD Coin",
      nftName: allocatedNft?.name ?? null,
      mediaUrl: allocatedNft?.imageUrl ?? null,
      isOpened: false,
      isRead: false,
    })
    .returning();

  // Mark NFT as allocated to this message
  if (allocatedNft) {
    await db
      .update(gachaNfts)
      .set({ messageId: msg.id })
      .where(eq(gachaNfts.id, allocatedNft.id));
  }

  return NextResponse.json({ success: true, message: msg });
}
