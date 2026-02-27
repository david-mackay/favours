"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { PayBounty } from "@/components/PayBounty";
import { ShareFavourModal } from "@/components/ShareFavourModal";
import type { Favour } from "@/server/db/schema";

type FavourWithUsernames = Favour & {
  creatorUsername?: string | null;
  claimerUsername?: string | null;
};

interface FavourDetailProps {
  favourId: string;
}

const statusConfig: Record<
  string,
  { color: string; label: string; icon: string }
> = {
  open: {
    color:
      "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
    label: "Open",
    icon: "🟢",
  },
  claimed: {
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    label: "Claimed",
    icon: "🟡",
  },
  completed: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
    label: "Completed",
    icon: "✅",
  },
  cancelled: {
    color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400",
    label: "Cancelled",
    icon: "⛔",
  },
};

function truncateWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function FavourDetail({ favourId }: FavourDetailProps) {
  const router = useRouter();
  const { address } = useAppKitAccount();
  const [favour, setFavour] = useState<FavourWithUsernames | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const fetchFavour = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/favours/${favourId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Favour not found");
      const data = await res.json();
      setFavour(data.favour);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load favour");
    } finally {
      setLoading(false);
    }
  }, [favourId]);

  useEffect(() => {
    void fetchFavour();
  }, [fetchFavour]);

  const handleClaim = async () => {
    if (!favour) return;
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch(`/api/favours/${favour.id}/claim`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to claim");
      }
      const data = await res.json();
      setFavour(data.favour);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to claim");
    } finally {
      setClaiming(false);
    }
  };

  const handleCancel = async () => {
    if (!favour) return;
    setError(null);
    try {
      const res = await fetch(`/api/favours/${favour.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cancel");
      }
      const data = await res.json();
      setFavour(data.favour);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel");
    }
  };

  const handleDelete = async () => {
    if (!favour) return;
    if (!confirm("Delete this favour? This cannot be undone.")) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/favours/${favour.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handlePaymentComplete = (signature: string) => {
    if (favour) {
      setFavour({
        ...favour,
        status: "completed",
        transactionSignature: signature,
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
      </div>
    );
  }

  if (!favour) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">🔍</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {error || "Favour not found"}
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          Back to feed
        </button>
      </div>
    );
  }

  const isCreator = address === favour.creatorWallet;
  const isClaimer = address === favour.claimerWallet;
  const status = statusConfig[favour.status] ?? statusConfig.open;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Status + Title */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
            >
              {status.icon} {status.label}
            </span>
            {favour.category && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                {favour.category}
              </span>
            )}
          </div>
          {address && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {favour.title}
        </h1>
      </div>

      {/* Thank-you */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-500/10 p-5">
        <div className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1 flex items-center gap-1.5">
          <span aria-hidden>🎁</span>
          Thank-you
        </div>
        <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">
          {favour.bountyAmount} {favour.bountyToken}
        </div>
      </div>

      {/* Description */}
      {favour.description && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Details
          </h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {favour.description}
          </p>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-1">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Posted by
          </div>
          <div className="text-sm">
            {isCreator ? (
              <span className="text-violet-600 dark:text-violet-400">You</span>
            ) : favour.creatorUsername ? (
              <Link
                href={`/profile/${favour.creatorWallet}`}
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                @{favour.creatorUsername}
              </Link>
            ) : (
              truncateWallet(favour.creatorWallet)
            )}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-1">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Claimed by
          </div>
          <div className="text-sm">
            {favour.claimerWallet ? (
              isClaimer ? (
                <span className="text-violet-600 dark:text-violet-400">
                  You
                </span>
              ) : favour.claimerUsername ? (
                <Link
                  href={`/profile/${favour.claimerWallet}`}
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                >
                  @{favour.claimerUsername}
                </Link>
              ) : (
                truncateWallet(favour.claimerWallet)
              )
            ) : (
              <span className="text-zinc-400 dark:text-zinc-600">
                No one yet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Transaction proof */}
      {favour.transactionSignature && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-1">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Payment Transaction
          </div>
          <a
            href={`https://solscan.io/tx/${favour.transactionSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-violet-600 dark:text-violet-400 hover:underline break-all"
          >
            {favour.transactionSignature}
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
        {/* Claim button (for non-creators on open favours) */}
        {favour.status === "open" && !isCreator && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full py-3 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {claiming ? "Claiming..." : "I'll do it! Claim this favour"}
          </button>
        )}

        {/* Send thank-you (for creator on claimed favours) */}
        {favour.status === "claimed" && isCreator && favour.claimerWallet && (
          <PayBounty
            favourId={favour.id}
            recipientWallet={favour.claimerWallet}
            amount={parseFloat(favour.bountyAmount)}
            token={favour.bountyToken}
            onComplete={handlePaymentComplete}
          />
        )}

        {/* Cancel and Delete (for creator on open favours) */}
        {favour.status === "open" && isCreator && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 px-4 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium text-sm transition-colors"
            >
              Cancel Favour
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-3 px-4 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}

        {/* Status message for claimer */}
        {favour.status === "claimed" && isClaimer && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
            You&apos;ve claimed this favour! Complete the errand and wait for
            the creator to confirm and send payment.
          </div>
        )}

        {/* Completed message */}
        {favour.status === "completed" && (
          <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-200">
            Thank-you sent! You made someone&apos;s day.
          </div>
        )}
      </div>

      {shareOpen && address && (
        <ShareFavourModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          favourId={favour.id}
          favourTitle={favour.title}
          currentWallet={address}
          onShare={(recipientWallet, message) => {
            router.push(
              `/messages/${recipientWallet}?shareFavour=${favour.id}${message ? `&shareMsg=${encodeURIComponent(message)}` : ""}`
            );
          }}
        />
      )}
    </div>
  );
}
