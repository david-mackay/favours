import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { messages } from "@/server/db/schema";
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
      eq(messages.type, "gift_envelope")
    ),
  });

  if (!msg) {
    return NextResponse.json({ error: "Envelope not found" }, { status: 404 });
  }

  if (msg.receiverWallet !== user.walletAddress) {
    return NextResponse.json({ error: "Not your envelope" }, { status: 403 });
  }

  if (msg.isOpened) {
    return NextResponse.json({ already: true, message: msg });
  }

  await db
    .update(messages)
    .set({ isOpened: true })
    .where(eq(messages.id, messageId));

  return NextResponse.json({ success: true });
}
