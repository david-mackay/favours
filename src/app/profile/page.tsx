import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { MyProfilePage } from "@/components/MyProfilePage";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  return <MyProfilePage walletAddress={user.walletAddress} />;
}
