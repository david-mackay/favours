import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { ChatView } from "@/components/ChatView";

interface ChatPageProps {
  params: Promise<{ walletAddress: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  const { walletAddress } = await params;
  return <ChatView partnerWallet={walletAddress} myWallet={user.walletAddress} />;
}
