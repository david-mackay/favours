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
  followers?: number;
  following?: number;
};

export function FriendsPage() {
  const { address } = useAppKitAccount();
  const [friends, setFriends] = useState<ProfileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${address}/following?limit=50`);
      const data = await res.json();
      const raw = data.users ?? data.profiles ?? [];
      const list: ProfileItem[] = raw.map(
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
        }),
      );
      setFriends(list);
    } catch {
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void fetchFriends();
  }, [fetchFriends]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/profile/search?q=${encodeURIComponent(searchQuery.trim())}`,
        );
        const data = await res.json();
        const raw = data.profiles ?? [];
        const list: ProfileItem[] = raw.map((p: Record<string, unknown>) => {
          const prof = (p.profile ?? p) as Record<string, unknown>;
          const id = String(prof.id ?? p.walletAddress ?? "");
          return {
            id,
            username: String(prof.username ?? "Anonymous"),
            bio: (prof.bio as string | null) ?? null,
            image: (prof.image as string | null) ?? null,
            walletAddress: (p.walletAddress as string) ?? id,
            followers: (p.socialCounts as { followers?: number })?.followers,
            following: (p.socialCounts as { following?: number })?.following,
          };
        });
        setSearchResults(list);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const checkFollowStatus = useCallback(
    async (profileId: string) => {
      if (!address) return;
      try {
        const res = await fetch(`/api/profile/${profileId}/follow`);
        const data = await res.json();
        setFollowStatus((s) => ({
          ...s,
          [profileId]: data.isFollowing ?? false,
        }));
      } catch {
        setFollowStatus((s) => ({ ...s, [profileId]: false }));
      }
    },
    [address],
  );

  const handleFollow = async (profileId: string) => {
    if (!address || profileId === address) return;
    try {
      const isFollowing = followStatus[profileId];
      const res = await fetch(`/api/profile/${profileId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowStatus((s) => ({ ...s, [profileId]: !isFollowing }));
        if (!isFollowing) void fetchFriends();
      }
    } catch {
      // ignore
    }
  };

  const profileId = (p: ProfileItem) => p.walletAddress ?? p.id;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Your friends
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Find people to help—and get reasons to visit.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full px-4 py-3 pl-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search results */}
        {searchQuery.trim().length >= 2 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Search results
            </h2>
            {searching ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No profiles found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((p) => {
                  const pid = profileId(p);
                  return (
                    <FriendCard
                      key={pid}
                      profile={p}
                      profileId={pid}
                      isFollowing={followStatus[pid]}
                      onFollow={() => handleFollow(pid)}
                      onMount={() => checkFollowStatus(pid)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Your friends list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            People you follow
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : friends.length === 0 && searchQuery.trim().length < 2 ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center space-y-3">
              <div className="text-4xl">👋</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Add friends to see their favours and give them reasons to visit!
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Search for people by username above, or find them from favour
                cards.
              </p>
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="space-y-2">
              {friends.map((p) => {
                const pid = profileId(p);
                return (
                  <Link key={pid} href={`/profile/${pid}`}>
                    <FriendCard profile={p} profileId={pid} />
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function FriendCard({
  profile,
  profileId,
  isFollowing,
  onFollow,
  onMount,
}: {
  profile: ProfileItem;
  profileId: string;
  isFollowing?: boolean;
  onFollow?: () => void;
  onMount?: () => void;
}) {
  useEffect(() => {
    onMount?.();
  }, [profileId, onMount]);

  const content = (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
        {profile.image ? (
          <img
            src={profile.image}
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
          @{profile.username}
        </p>
        {profile.bio && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {profile.bio}
          </p>
        )}
      </div>
      {onFollow && (
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
      )}
    </div>
  );

  if (onFollow) {
    return <Link href={`/profile/${profileId}`}>{content}</Link>;
  }
  return content;
}
