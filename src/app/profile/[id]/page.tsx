import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { UserProfilePage } from "@/components/UserProfilePage";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfile({ params }: ProfilePageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  const { id } = await params;
  return <UserProfilePage profileId={id} currentWallet={user.walletAddress} />;
}
