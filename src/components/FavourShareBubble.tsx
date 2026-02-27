"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface FavourData {
  id: string;
  title: string;
  description: string | null;
  bountyAmount: string;
  bountyToken: string;
  status: string;
  category: string | null;
  creatorWallet: string;
  creatorUsername?: string | null;
}

const statusColors: Record<string, string> = {
  open: "bg-green-500/20 text-green-300",
  claimed: "bg-amber-500/20 text-amber-300",
  completed: "bg-blue-500/20 text-blue-300",
  cancelled: "bg-zinc-500/20 text-zinc-400",
};

export function FavourShareBubble({
  favourId,
  content,
  isMine,
}: {
  favourId: string;
  content: string | null;
  isMine: boolean;
}) {
  const [favour, setFavour] = useState<FavourData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/favours/${favourId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.favour) setFavour(data.favour);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favourId]);

  if (loading) {
    return (
      <div className="w-56 space-y-2 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
    );
  }

  if (!favour) {
    return (
      <div className="text-xs opacity-60 italic">Favour no longer available</div>
    );
  }

  return (
    <div className="space-y-2">
      {content && (
        <p className="text-sm whitespace-pre-wrap break-words mb-2">{content}</p>
      )}
      <Link
        href={`/favour/${favour.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
      >
        <div
          className={`rounded-xl border p-3 space-y-2 transition-colors ${
            isMine
              ? "border-violet-400/30 bg-violet-500/10 hover:bg-violet-500/20"
              : "border-zinc-600/30 bg-zinc-700/30 hover:bg-zinc-700/50"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{favour.title}</p>
              {favour.description && (
                <p className="text-xs opacity-70 line-clamp-2 mt-0.5">
                  {favour.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-200 text-xs font-bold">
              <span>🎁</span>
              {favour.bountyAmount} {favour.bountyToken}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                statusColors[favour.status] ?? statusColors.open
              }`}
            >
              {favour.status}
            </span>
            <span className="text-[10px] opacity-50">
              View favour →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
