"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { FavourCard } from "@/components/FavourCard";
import type { Favour } from "@/server/db/schema";

interface UserProfilePageProps {
  profileId: string;
  currentWallet: string;
}

interface ProfileData {
  profile: {
    id?: string;
    username?: string;
    bio?: string;
    image?: string | null;
    walletAddress?: string;
    customProperties?: Record<string, string>;
  } | null;
  socialCounts: {
    followers: number;
    following: number;
  };
}

export function UserProfilePage({
  profileId,
  currentWallet,
}: UserProfilePageProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [favours, setFavours] = useState<Favour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, followRes] = await Promise.all([
        fetch(`/api/profile/${profileId}`, { cache: "no-store" }),
        fetch(`/api/profile/${profileId}/follow`, { cache: "no-store" }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfileData(data);

        // Fetch favours by this user's wallet if available
        const wallet = data?.profile?.walletAddress;
        if (wallet) {
          const favoursRes = await fetch(
            `/api/favours?filter=all&status=open`,
            { cache: "no-store" },
          );
          if (favoursRes.ok) {
            const fdata = await favoursRes.json();
            // Filter for this user's favours
            setFavours(
              (fdata.favours ?? []).filter(
                (f: Favour) => f.creatorWallet === wallet,
              ),
            );
          }
        }
      }

      if (followRes.ok) {
        const data = await followRes.json();
        setIsFollowing(data.isFollowing ?? false);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/profile/${profileId}/follow`, { method });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        if (profileData) {
          setProfileData({
            ...profileData,
            socialCounts: {
              ...profileData.socialCounts,
              followers:
                profileData.socialCounts.followers + (isFollowing ? -1 : 1),
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to follow/unfollow", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const profile = profileData?.profile;
  const counts = profileData?.socialCounts;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        ) : !profile ? (
          <div className="text-center py-12 space-y-3">
            <div className="text-4xl">👤</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Profile not found
            </p>
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                    {profile.image ? (
                      <img
                        src={profile.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-zinc-400">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {profile.username ?? "Anonymous"}
                    </h1>
                    {profile.bio && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {profile.bio}
                      </p>
                    )}
                    {profile.walletAddress && (
                      <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500">
                        {profile.walletAddress.slice(0, 8)}...
                        {profile.walletAddress.slice(-6)}
                      </p>
                    )}
                  </div>
                </div>

                {profile.walletAddress !== currentWallet && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      isFollowing
                        ? "border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        : "bg-violet-600 hover:bg-violet-700 text-white"
                    }`}
                  >
                    {followLoading
                      ? "..."
                      : isFollowing
                        ? "Following"
                        : "Follow"}
                  </button>
                )}
              </div>

              {/* Social counts */}
              <div className="flex gap-6 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href={`/profile/${profileId}/followers`}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {counts?.followers ?? 0}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Followers
                  </div>
                </Link>
                <Link
                  href={`/profile/${profileId}/following`}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {counts?.following ?? 0}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Following
                  </div>
                </Link>
              </div>
            </div>

            {/* User's favours */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Open Favours
              </h2>
              {favours.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-3xl">🤷</div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No open favours right now.
                  </p>
                </div>
              ) : (
                favours.map((favour) => (
                  <FavourCard
                    key={favour.id}
                    favour={favour}
                    currentWallet={currentWallet}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
