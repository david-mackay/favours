import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { ProfileSetup } from "@/components/ProfileSetup";

export default async function SetupPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  return <ProfileSetup />;
}
