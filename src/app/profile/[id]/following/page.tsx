import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { ProfileListPage } from "@/components/ProfileListPage";

interface FollowingPageProps {
  params: Promise<{ id: string }>;
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  const { id } = await params;
  return (
    <ProfileListPage
      profileId={id}
      listType="following"
      title="Following"
    />
  );
}
