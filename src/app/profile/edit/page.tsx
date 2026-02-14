import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { getProfile } from "@/server/tapestry";
import { ProfileSetup } from "@/components/ProfileSetup";

export default async function EditProfilePage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  const profileData = await getProfile(user.walletAddress).catch(() => null);
  const profile = profileData?.profile as
    | { username?: string; bio?: string; image?: string | null }
    | undefined;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <ProfileSetup
          initialData={{
            username: profile?.username,
            bio: profile?.bio ?? undefined,
            image: profile?.image ?? undefined,
          }}
        />
    </div>
  );
}
