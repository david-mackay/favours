"use client";

import { useCallback, useEffect, useState } from "react";

interface GoldGiftCardProps {
  tier: {
    label: string;
    amount: number;
    description: string;
  };
  onSelect: (amount: number) => void;
}

export function GoldGiftCard({ tier, onSelect }: GoldGiftCardProps) {
  const [usdPrice, setUsdPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrice = useCallback(async () => {
    try {
      const atomicAmount = Math.round(tier.amount * 1e6).toString();
      const params = new URLSearchParams({
        inputMint: "AymATz4TCL9sWNEEV9Kvyz45CHVhDZ6kUgjTJPzLpU9P",
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: atomicAmount,
        taker: "11111111111111111111111111111111",
      });
      const res = await fetch(`/api/swap/order?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.outAmount) {
          const usdc = parseInt(data.outAmount, 10) / 1e6;
          setUsdPrice(usdc.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }));
        }
      }
    } catch {
      // price unavailable
    } finally {
      setLoading(false);
    }
  }, [tier.amount]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return (
    <button
      type="button"
      onClick={() => onSelect(tier.amount)}
      className="group relative w-full overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-400/50 p-6 text-left transition-all hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98]"
    >
      {/* Shimmer sweep */}
      <div className="gold-card-shimmer absolute inset-0 pointer-events-none" />

      {/* Gold glow background accent */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-amber-500/5 dark:bg-amber-500/10 blur-3xl group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/20 transition-colors" />

      <div className="relative z-10 space-y-4">
        {/* Icon and tier */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl mb-2">🥇</div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{tier.label}</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{tier.amount} oz</p>
            <p className="text-xs text-amber-600/50 dark:text-amber-500/60 mt-0.5">
              {loading ? (
                <span className="inline-block w-16 h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              ) : usdPrice ? (
                `≈ ${usdPrice}`
              ) : (
                "Price unavailable"
              )}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{tier.description}</p>

        {/* CTA */}
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 group-hover:from-amber-500 group-hover:to-amber-600 text-white text-sm font-semibold transition-all">
          Send as Gift
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes cardShimmer {
          0% { transform: translateX(-100%) rotate(15deg); }
          100% { transform: translateX(300%) rotate(15deg); }
        }
        .gold-card-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 30%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(251, 191, 36, 0.06),
            transparent
          );
          animation: cardShimmer 4s ease-in-out infinite;
        }
      `}</style>
    </button>
  );
}

export const GOLD_TIERS = [
  {
    label: "Gold Starter",
    amount: 0.25,
    description: "A quarter troy ounce of tokenized gold. A thoughtful, lasting gift.",
  },
  {
    label: "Gold Classic",
    amount: 0.5,
    description: "Half a troy ounce. The sweet spot between meaningful and generous.",
  },
  {
    label: "Gold Premium",
    amount: 1.0,
    description: "One full troy ounce of gold. A truly premium gift that holds its value.",
  },
];
