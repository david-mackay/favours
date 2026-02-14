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
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Edit profile
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Update your username, bio, or profile photo.
          </p>
        </div>
        <ProfileSetup
          initialData={{
            username: profile?.username,
            bio: profile?.bio ?? undefined,
            image: profile?.image ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
