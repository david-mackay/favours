"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  TOKENS,
  TokenSelectorModal,
  TokenButton,
} from "@/components/TokenSelector";

type Visibility = "public" | "followers" | "close";

type FollowerItem = {
  id: string;
  username: string;
  walletAddress?: string;
};

export interface CreateFavourFormProps {
  onSuccess?: (favourId: string) => void;
}

const categories = [
  { value: "errand", label: "Errand", emoji: "🏃" },
  { value: "delivery", label: "Delivery", emoji: "📦" },
  { value: "tech", label: "Tech Help", emoji: "💻" },
  { value: "cleaning", label: "Cleaning", emoji: "🧹" },
  { value: "food", label: "Food", emoji: "🍕" },
  { value: "shopping", label: "Shopping", emoji: "🛒" },
  { value: "moving", label: "Moving", emoji: "🚚" },
  { value: "other", label: "Other", emoji: "✨" },
];

export function CreateFavourForm({ onSuccess }: CreateFavourFormProps = {}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bountyAmount, setBountyAmount] = useState("");
  const [bountyToken, setBountyToken] = useState("USDC");
  const [category, setCategory] = useState("errand");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [allowedViewers, setAllowedViewers] = useState<string[]>([]);
  const [followers, setFollowers] = useState<FollowerItem[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const { address } = useAppKitAccount();

  const fetchFollowers = useCallback(async () => {
    if (!address) return;
    setFollowersLoading(true);
    try {
      const res = await fetch(`/api/profile/${address}/followers?limit=100`);
      const data = await res.json();
      const raw = data.users ?? data.profiles ?? [];
      setFollowers(
        raw.map(
          (p: { id?: string; username?: string; wallet?: { id?: string } }) => ({
            id: p.wallet?.id ?? p.id ?? "",
            username: p.username ?? "Anonymous",
            walletAddress: p.wallet?.id ?? p.id,
          })
        )
      );
    } catch {
      setFollowers([]);
    } finally {
      setFollowersLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (visibility === "close") void fetchFollowers();
  }, [visibility, fetchFollowers]);

  const toggleAllowedViewer = (walletId: string) => {
    setAllowedViewers((prev) =>
      prev.includes(walletId)
        ? prev.filter((w) => w !== walletId)
        : [...prev, walletId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/favours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          bountyAmount: parseFloat(bountyAmount),
          bountyToken,
          category,
          visibility,
          allowedViewers: visibility === "close" ? allowedViewers : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create favour");
      }

      const data = await res.json();
      if (onSuccess) {
        onSuccess(data.favour.id);
      } else {
        router.push(`/favour/${data.favour.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create favour");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          What do you need done?
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Pick up my dry cleaning on Main St"
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Details <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details about what needs to be done, location, time constraints..."
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Category
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                category === cat.value
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Thank-you */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Thank-you
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={bountyAmount}
              onChange={(e) => setBountyAmount(e.target.value)}
              placeholder="0.05"
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <TokenButton
            token={TOKENS.find((t) => t.symbol === bountyToken) ?? TOKENS[0]}
            onClick={() => setTokenModalOpen(true)}
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          A little thank-you for whoever helps out.
        </p>
      </div>

      <TokenSelectorModal
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        tokens={TOKENS}
        selectedSymbol={bountyToken}
        onSelect={setBountyToken}
      />

      {/* Visibility */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Who can see this?
        </label>
        <div className="space-y-2">
          {[
            {
              value: "public" as const,
              label: "Public",
              desc: "Anyone on the app",
              icon: "🌐",
            },
            {
              value: "followers" as const,
              label: "Followers",
              desc: "Only people who follow you",
              icon: "👥",
            },
            {
              value: "close" as const,
              label: "Close",
              desc: "Select specific people",
              icon: "🔒",
            },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                visibility === opt.value
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {opt.label}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {opt.desc}
                </p>
              </div>
              {visibility === opt.value && (
                <span className="text-violet-600 dark:text-violet-400">✓</span>
              )}
            </button>
          ))}
        </div>

        {visibility === "close" && (
          <div className="mt-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 max-h-40 overflow-y-auto">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              Select who can see this favour
            </p>
            {followersLoading ? (
              <p className="text-xs text-zinc-500">Loading followers...</p>
            ) : followers.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No followers yet. Share your profile to get followers first.
              </p>
            ) : (
              <div className="space-y-1">
                {followers.map((f) => {
                  const pid = f.walletAddress ?? f.id;
                  return (
                    <label
                      key={pid}
                      className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-2 -mx-2"
                    >
                      <input
                        type="checkbox"
                        checked={allowedViewers.includes(pid)}
                        onChange={() => toggleAllowedViewer(pid)}
                        className="rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">
                        @{f.username}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={
          submitting ||
          !title.trim() ||
          !bountyAmount ||
          (visibility === "close" && allowedViewers.length === 0)
        }
        className="w-full py-3 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Posting..." : "Post Favour"}
      </button>
    </form>
  );
}
