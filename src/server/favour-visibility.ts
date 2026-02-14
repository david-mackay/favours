import { checkFollowStatus } from "@/server/tapestry";
import type { Favour } from "@/server/db/schema";

export type Visibility = "public" | "followers" | "close";

export function parseAllowedViewers(allowedViewers: string | null): string[] {
  if (!allowedViewers?.trim()) return [];
  try {
    const parsed = JSON.parse(allowedViewers) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export async function canViewFavour(
  favour: Pick<Favour, "creatorWallet" | "claimerWallet" | "visibility" | "allowedViewers">,
  viewerWallet: string | null
): Promise<boolean> {
  if (!viewerWallet) {
    return favour.visibility === "public";
  }

  // Creator and claimer can always view
  if (favour.creatorWallet === viewerWallet || favour.claimerWallet === viewerWallet) {
    return true;
  }

  switch (favour.visibility) {
    case "public":
      return true;
    case "followers": {
      const isFollowing = await checkFollowStatus(viewerWallet, favour.creatorWallet);
      return isFollowing.isFollowing;
    }
    case "close": {
      const allowed = parseAllowedViewers(favour.allowedViewers);
      return allowed.includes(viewerWallet);
    }
    default:
      return favour.visibility === "public";
  }
}
