"use client";

import { useEffect, useState } from "react";

interface FavourSummary {
  id: string;
  title: string;
  description: string | null;
  bountyAmount: string;
  bountyToken: string;
  status: string;
  category: string | null;
}

interface FavourPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (favourId: string) => void;
}

export function FavourPickerModal({ open, onClose, onSelect }: FavourPickerModalProps) {
  const [favours, setFavours] = useState<FavourSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/favours?filter=all&status=open&limit=20")
      .then((r) => (r.ok ? r.json() : { favours: [] }))
      .then((data) => setFavours(data.favours ?? []))
      .catch(() => setFavours([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Share a Favour
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              ))}
            </div>
          ) : favours.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-3xl">📭</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No open favours to share</p>
            </div>
          ) : (
            <div className="space-y-1">
              {favours.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelect(f.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left active:scale-[0.99]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {f.title}
                    </p>
                    {f.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {f.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-bold">
                    🎁 {f.bountyAmount} {f.bountyToken}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
