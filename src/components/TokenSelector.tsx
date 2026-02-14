"use client";

import Image from "next/image";

export type TokenDef = {
  symbol: string;
  mint: string;
  decimals: number;
  icon: string;
};

export const TOKENS: TokenDef[] = [
  {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
];

export function TokenSelectorModal({
  open,
  onClose,
  tokens,
  selectedSymbol,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  tokens: TokenDef[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950 sm:items-center sm:justify-center sm:bg-black/60 sm:backdrop-blur-sm">
      <div className="flex flex-col h-full w-full sm:h-[85vh] sm:max-h-[600px] sm:max-w-md sm:rounded-2xl sm:border sm:border-zinc-200 dark:sm:border-zinc-800 sm:shadow-xl bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Select token
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-2">
          <ul className="space-y-1">
            {tokens.map((t) => (
              <li key={t.mint}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(t.symbol);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-colors touch-manipulation active:scale-[0.98] ${
                    selectedSymbol === t.symbol
                      ? "bg-violet-50 dark:bg-violet-500/20 ring-1 ring-violet-200 dark:ring-violet-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-zinc-200 dark:bg-zinc-700">
                    <Image
                      src={t.icon}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {t.symbol}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate font-mono">
                      {t.mint.slice(0, 8)}…{t.mint.slice(-8)}
                    </p>
                  </div>
                  {selectedSymbol === t.symbol && (
                    <svg
                      className="w-6 h-6 text-violet-600 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function TokenButton({
  token,
  onClick,
}: {
  token: TokenDef;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 min-w-0 px-3 py-3 sm:px-4 sm:py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm font-medium transition-colors touch-manipulation active:scale-[0.98]"
    >
      <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden shrink-0 bg-zinc-200 dark:bg-zinc-600">
        <Image
          src={token.icon}
          alt=""
          fill
          sizes="28px"
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="truncate">{token.symbol}</span>
      <svg
        className="w-4 h-4 text-zinc-400 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
}
