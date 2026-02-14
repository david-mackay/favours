"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppKit } from "@reown/appkit/react";
import { Navbar } from "@/components/Navbar";
import { FavourCard } from "@/components/FavourCard";
import { reownAppKit } from "@/context/appkit";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import type { Favour } from "@/server/db/schema";

interface MyProfilePageProps {
  walletAddress: string;
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
  needsSetup?: boolean;
}

export function MyProfilePage({ walletAddress }: MyProfilePageProps) {
  const router = useRouter();
  const walletAuth = useWalletAuth();
  const { open } = useAppKit();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [favours, setFavours] = useState<Favour[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, favoursRes] = await Promise.all([
        fetch("/api/profile", { cache: "no-store" }),
        fetch("/api/favours?filter=mine", { cache: "no-store" }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.needsSetup) {
          router.push("/profile/setup");
          return;
        }
        setProfileData(data);
      }

      if (favoursRes.ok) {
        const data = await favoursRes.json();
        setFavours(data.favours ?? []);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleDeleteFavour = async (favourId: string) => {
    setDeletingId(favourId);
    try {
      const res = await fetch(`/api/favours/${favourId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setFavours((prev) => prev.filter((f) => f.id !== favourId));
    } catch (error) {
      console.error("Failed to delete favour", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDisconnect = async () => {
    await walletAuth.logout();
    await reownAppKit.disconnect("solana").catch(() => {});
    router.replace("/auth");
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
        ) : (
          <>
            {/* Profile card */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                    {profile?.image ? (
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
                      {profile?.username ?? "Anonymous"}
                    </h1>
                    {profile?.bio && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {profile.bio}
                      </p>
                    )}
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500">
                      {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/profile/edit"
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => open({ view: "Account" })}
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    Wallet
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 text-xs rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>

              {/* Social counts */}
              <div className="flex gap-6 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-center">
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {counts?.followers ?? 0}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Followers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {counts?.following ?? 0}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Following
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {favours.length}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Favours
                  </div>
                </div>
              </div>
            </div>

            {/* My favours */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Favours you&apos;ve posted
              </h2>
              {favours.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-3xl">📝</div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    You haven&apos;t posted any favours yet.
                  </p>
                </div>
              ) : (
                favours.map((favour) => (
                  <FavourCard
                    key={favour.id}
                    favour={favour}
                    currentWallet={walletAddress}
                    onDelete={
                      favour.status === "open"
                        ? handleDeleteFavour
                        : undefined
                    }
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
