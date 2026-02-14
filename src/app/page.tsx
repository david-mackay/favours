import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { FeedPage } from "@/components/FeedPage";

export default async function Home() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  return <FeedPage />;
}
