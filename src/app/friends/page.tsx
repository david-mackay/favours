import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { FriendsPage } from "@/components/FriendsPage";

export default async function FriendsRoute() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  return <FriendsPage />;
}
