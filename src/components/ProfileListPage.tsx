"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { Navbar } from "@/components/Navbar";

type ProfileItem = {
  id: string;
  username: string;
  bio?: string | null;
  image?: string | null;
  walletAddress?: string | null;
};

interface ProfileListPageProps {
  profileId: string;
  listType: "followers" | "following";
  title: string;
}

export function ProfileListPage({
  profileId,
  listType,
  title,
}: ProfileListPageProps) {
  const { address } = useAppKitAccount();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/profile/${profileId}/${listType}?limit=50`
      );
      const data = await res.json();
      const raw = data.users ?? data.profiles ?? [];
      setProfiles(
        raw.map(
          (p: {
            id?: string;
            username?: string;
            bio?: string;
            image?: string;
            wallet?: { id?: string };
          }) => ({
            id: p.id ?? "",
            username: p.username ?? "Anonymous",
            bio: p.bio ?? null,
            image: p.image ?? null,
            walletAddress: p.wallet?.id ?? p.id,
          })
        )
      );
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, listType]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const checkFollowStatus = useCallback(
    async (pid: string) => {
      if (!address) return;
      try {
        const res = await fetch(`/api/profile/${pid}/follow`);
        const data = await res.json();
        setFollowStatus((s) => ({
          ...s,
          [pid]: data.isFollowing ?? false,
        }));
      } catch {
        setFollowStatus((s) => ({ ...s, [pid]: false }));
      }
    },
    [address]
  );

  const handleFollow = async (pid: string) => {
    if (!address || pid === address) return;
    try {
      const isFollowing = followStatus[pid];
      const res = await fetch(`/api/profile/${pid}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowStatus((s) => ({ ...s, [pid]: !isFollowing }));
      }
    } catch {
      // ignore
    }
  };

  const getProfileId = (p: ProfileItem) => p.walletAddress ?? p.id;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${profileId}`}
            className="p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Back to profile"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center space-y-3">
            <div className="text-4xl">👋</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {listType === "followers"
                ? "No followers yet."
                : "Not following anyone yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p) => {
              const pid = getProfileId(p);
              const isOwnProfile = pid === address;
              return (
                <Link key={pid} href={`/profile/${pid}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl text-zinc-400">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        @{p.username}
                      </p>
                      {p.bio && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {p.bio}
                        </p>
                      )}
                    </div>
                    {!isOwnProfile && (
                      <ProfileFollowButton
                        profileId={pid}
                        isFollowing={followStatus[pid]}
                        onFollow={() => handleFollow(pid)}
                        onMount={() => checkFollowStatus(pid)}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileFollowButton({
  profileId,
  isFollowing,
  onFollow,
  onMount,
}: {
  profileId: string;
  isFollowing?: boolean;
  onFollow: () => void;
  onMount: () => void;
}) {
  useEffect(() => {
    onMount();
  }, [profileId, onMount]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFollow();
      }}
      className={`px-4 py-2 rounded-lg text-sm font-medium shrink-0 transition-colors touch-manipulation ${
        isFollowing
          ? "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
          : "bg-violet-600 hover:bg-violet-700 text-white"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
