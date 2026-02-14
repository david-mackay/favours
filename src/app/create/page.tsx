import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { CreateFavourPage } from "@/components/CreateFavourPage";

export default async function Create() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  return <CreateFavourPage />;
}
