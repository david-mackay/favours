import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { MarketplacePage } from "@/components/MarketplacePage";

export default async function MarketplaceRoute() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  return <MarketplacePage walletAddress={user.walletAddress} />;
}
