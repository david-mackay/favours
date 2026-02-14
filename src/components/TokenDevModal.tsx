"use client";

import { useState, useCallback } from "react";

type JupiterToken = {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
};

function toTokenEntry(t: JupiterToken): string {
  return `  {
    symbol: "${t.symbol}",
    mint: "${t.id}",
    decimals: ${t.decimals},
    icon: "${t.icon ?? ""}",
  },`;
}

export function TokenDevModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JupiterToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/swap/tokens?query=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Search failed");
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const copyEntry = useCallback((t: JupiterToken) => {
    const entry = toTokenEntry(t);
    navigator.clipboard.writeText(entry);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const copyAll = useCallback(() => {
    const text = results.map(toTokenEntry).join("\n");
    navigator.clipboard.writeText(`[\n${text}\n]`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [results]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-100">
            Token discovery (dev)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-zinc-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search by symbol, name, or mint..."
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={search}
              disabled={loading || !query.trim()}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {results.length === 0 && !loading && (
            <p className="text-sm text-zinc-500 text-center py-8">
              Search for a token to see results. Copy entries to paste into TOKENS in TokenSelector.tsx.
            </p>
          )}
          <ul className="space-y-2">
            {results.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
              >
                {t.icon ? (
                  <img
                    src={t.icon}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {t.symbol}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{t.name}</p>
                  <p className="text-xs text-zinc-600 font-mono truncate">
                    {t.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">{t.decimals}d</span>
                  <button
                    type="button"
                    onClick={() => copyEntry(t)}
                    className="px-2 py-1 rounded text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                  >
                    Copy
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {results.length > 0 && (
          <div className="p-4 border-t border-zinc-700">
            <button
              type="button"
              onClick={copyAll}
              className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium"
            >
              {copied ? "Copied!" : "Copy all as TOKENS array"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
