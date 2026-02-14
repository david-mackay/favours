import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { ProfileListPage } from "@/components/ProfileListPage";

interface FollowersPageProps {
  params: Promise<{ id: string }>;
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  const { id } = await params;
  return (
    <ProfileListPage
      profileId={id}
      listType="followers"
      title="Followers"
    />
  );
}
