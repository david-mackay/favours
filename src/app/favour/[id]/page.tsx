import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/server/auth/session";
import { FavourDetailPage } from "@/components/FavourDetailPage";

interface FavourPageProps {
  params: Promise<{ id: string }>;
}

export default async function FavourPage({ params }: FavourPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  const { id } = await params;
  return <FavourDetailPage favourId={id} />;
}
