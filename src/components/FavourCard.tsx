"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Favour } from "@/server/db/schema";

type FavourWithUsernames = Favour & {
  creatorUsername?: string | null;
  creatorImage?: string | null;
  claimerUsername?: string | null;
  claimerImage?: string | null;
};

interface FavourCardProps {
  favour: FavourWithUsernames;
  currentWallet?: string;
  onDelete?: (favourId: string) => void;
}

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  claimed:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  cancelled: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400",
};

const visibilityLabels: Record<string, string> = {
  public: "🌐 Public",
  followers: "👥 Followers",
  close: "🔒 Close",
};

const categoryEmoji: Record<string, string> = {
  errand: "🏃",
  delivery: "📦",
  tech: "💻",
  cleaning: "🧹",
  food: "🍕",
  shopping: "🛒",
  moving: "📦",
  other: "✨",
};

function truncateWallet(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function FavourCard({
  favour,
  currentWallet,
  onDelete,
}: FavourCardProps) {
  const router = useRouter();
  const isCreator = currentWallet === favour.creatorWallet;
  const isClaimer = currentWallet === favour.claimerWallet;
  const canDelete =
    isCreator && favour.status === "open" && typeof onDelete === "function";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canDelete && confirm("Delete this favour? This cannot be undone.")) {
      onDelete?.(favour.id);
    }
  };

  return (
    <Link href={`/favour/${favour.id}`} className="block group relative">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-3 transition-all hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm">
        {/* Delete button (creator, open favours only) */}
        {canDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors z-10"
            aria-label="Delete favour"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Poster avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-zinc-200 dark:bg-zinc-700 flex-shrink-0">
              {favour.creatorImage ? (
                <img
                  src={favour.creatorImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg text-zinc-400">
                  👤
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                {favour.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                {isCreator ? (
                  "You"
                ) : favour.creatorUsername ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/profile/${favour.creatorWallet}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/profile/${favour.creatorWallet}`);
                      }
                    }}
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                  >
                    @{favour.creatorUsername}
                  </span>
                ) : (
                  truncateWallet(favour.creatorWallet)
                )}
              </span>
              <span>·</span>
              <span>{timeAgo(favour.createdAt)}</span>
              {favour.category && (
                <>
                  <span>·</span>
                  <span>
                    {categoryEmoji[favour.category] ?? "✨"} {favour.category}
                  </span>
                </>
              )}
              </div>
            </div>
          </div>

          {/* Thank-you badge */}
          <div className="flex-shrink-0 text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold text-sm">
              <span aria-hidden>🎁</span>
              {favour.bountyAmount} {favour.bountyToken}
            </div>
          </div>
        </div>

        {/* Description */}
        {favour.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {favour.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                statusColors[favour.status] ?? statusColors.open
              }`}
            >
              {favour.status}
            </span>
            {favour.visibility && favour.visibility !== "public" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
                {visibilityLabels[favour.visibility] ?? favour.visibility}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {favour.claimerWallet && (
              <span>
                Claimed by{" "}
                <span>
                  {isClaimer
                    ? "you"
                    : (favour.claimerUsername ??
                      truncateWallet(favour.claimerWallet))}
                </span>
              </span>
            )}
            {favour.expiresAt && (
              <span>Expires {timeAgo(favour.expiresAt)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
