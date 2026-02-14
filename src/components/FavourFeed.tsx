"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { FavourCard } from "@/components/FavourCard";
import type { Favour } from "@/server/db/schema";

type FilterType = "all" | "mine" | "claimed";

export function FavourFeed() {
  const { address } = useAppKitAccount();
  const [favours, setFavours] = useState<Favour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchFavours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("filter", filter);
      if (filter === "all") params.set("status", "open");

      const res = await fetch(`/api/favours?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load favours");

      const data = await res.json();
      setFavours(data.favours ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load favours");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchFavours();
  }, [fetchFavours]);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "Open" },
    { key: "mine", label: "My Favours" },
    { key: "claimed", label: "Claimed" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 w-full sm:w-fit overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-1.5 text-sm rounded-lg transition-colors touch-manipulation shrink-0 ${
              filter === f.key
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse"
            >
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3 mb-3" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-2" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : favours.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">
            {filter === "all" ? "🤝" : filter === "mine" ? "📝" : "🎯"}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {filter === "all"
              ? "No favours yet. Post one and give your friends a reason to drop by!"
              : filter === "mine"
                ? "You haven't posted any favours yet."
                : "You haven't claimed any favours yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {favours.map((favour) => (
            <FavourCard
              key={favour.id}
              favour={favour}
              currentWallet={address}
            />
          ))}
        </div>
      )}
    </div>
  );
}
