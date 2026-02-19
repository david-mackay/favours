import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { MessagesPage } from "@/components/MessagesPage";

export default async function Messages() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  return <MessagesPage walletAddress={user.walletAddress} />;
}
