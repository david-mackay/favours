/**
 * Tapestry client for managing social profiles and follows.
 * All endpoints use api/v1.
 * @see https://docs.usetapestry.dev/documentation/profile
 * @see https://docs.usetapestry.dev/documentation/follows
 */
import { SocialFi } from "socialfi";

const API_KEY = process.env.TAPESTRY_API_KEY ?? "";

if (!API_KEY) {
  console.warn("TAPESTRY_API_KEY is not set. Social features will not work.");
}

const API_BASE = "https://api.usetapestry.dev/api/v1";

export const tapestry = new SocialFi({
  baseURL: API_BASE + "/",
});

// ── Profile helpers ─────────────────────────────────────────────────────────

export async function findOrCreateProfile(params: {
  walletAddress: string;
  username: string;
  bio?: string;
  image?: string;
  customProperties?: { key: string; value: string | number | boolean }[];
}) {
  return tapestry.profiles.findOrCreateCreate(
    { apiKey: API_KEY },
    {
      id: params.walletAddress, // Use wallet as id so we can look up by wallet
      walletAddress: params.walletAddress,
      username: params.username,
      bio: params.bio ?? "",
      image: params.image,
      properties: params.customProperties,
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    },
  );
}

export async function updateProfile(
  profileId: string,
  params: {
    username?: string;
    bio?: string;
    image?: string;
    customProperties?: { key: string; value: string | number | boolean }[];
  },
) {
  return tapestry.profiles.profilesUpdate(
    { apiKey: API_KEY, id: profileId },
    {
      username: params.username,
      bio: params.bio,
      image: params.image,
      properties: params.customProperties,
    },
  );
}

export async function getProfile(profileId: string) {
  try {
    return await tapestry.profiles.profilesDetail({
      apiKey: API_KEY,
      id: profileId,
    });
  } catch {
    return { profile: null, socialCounts: null };
  }
}

/** Get username for a wallet (from Tapestry profile). Returns null if not found. */
export async function getUsernameForWallet(
  walletAddress: string,
): Promise<string | null> {
  try {
    const data = await getProfile(walletAddress);
    const profile = data?.profile as { username?: string } | undefined;
    return profile?.username ?? null;
  } catch {
    return null;
  }
}

/** Get username and image for a wallet (from Tapestry profile). */
export async function getProfileInfoForWallet(walletAddress: string): Promise<{
  username: string | null;
  image: string | null;
}> {
  try {
    const data = await getProfile(walletAddress);
    const profile = data?.profile as { username?: string; image?: string } | undefined;
    return {
      username: profile?.username ?? null,
      image: profile?.image ?? null,
    };
  } catch {
    return { username: null, image: null };
  }
}

// ── Follow helpers (SocialFi package + correct path order) ────────────────────

export async function followUser(followerId: string, followeeId: string) {
  return tapestry.followers.postFollowers(
    { apiKey: API_KEY },
    { startId: followerId, endId: followeeId },
  );
}

export async function unfollowUser(followerId: string, followeeId: string) {
  return tapestry.followers.removeCreate(
    { apiKey: API_KEY },
    { startId: followerId, endId: followeeId },
  );
}

export async function checkFollowStatus(
  followerId: string,
  followeeId: string,
) {
  const data = await tapestry.followers.stateList({
    apiKey: API_KEY,
    startId: followerId,
    endId: followeeId,
  });
  return { isFollowing: data?.isFollowing ?? false };
}

export async function getFollowers(profileId: string, limit = 20, offset = 0) {
  const data = await tapestry.profiles.followersList({
    apiKey: API_KEY,
    id: profileId,
    page: String(Math.floor(offset / limit) + 1),
    pageSize: String(limit),
  });
  return { users: data?.profiles ?? [], pagination: data };
}

export async function getFollowing(profileId: string, limit = 20, offset = 0) {
  const data = await tapestry.profiles.followingList({
    apiKey: API_KEY,
    id: profileId,
    page: String(Math.floor(offset / limit) + 1),
    pageSize: String(limit),
  });
  return { users: data?.profiles ?? [], pagination: data };
}

export async function getFollowersCount(profileId: string) {
  const data = await getProfile(profileId);
  return { count: data?.socialCounts?.followers ?? 0 };
}

export async function getFollowingCount(profileId: string) {
  const data = await getProfile(profileId);
  return { count: data?.socialCounts?.following ?? 0 };
}

/** Search profiles by username or id. */
export async function searchProfiles(query: string, pageSize = 20) {
  if (!query || query.trim().length < 2) {
    return { profiles: [], page: 1, pageSize: 0 };
  }
  try {
    const data = await tapestry.search.profilesList({
      apiKey: API_KEY,
      query: query.trim(),
      pageSize: String(pageSize),
    });
    return {
      profiles: data?.profiles ?? [],
      page: data?.page ?? 1,
      pageSize: data?.pageSize ?? pageSize,
    };
  } catch {
    return { profiles: [], page: 1, pageSize: 0 };
  }
}
