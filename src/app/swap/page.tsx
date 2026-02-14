import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { SwapPage } from "@/components/SwapPage";

export default async function SwapRoute() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  return <SwapPage />;
}
