"use client";

import { useCallback, useEffect, useState } from "react";

export type GiftType = "envelope" | "gacha" | "gold" | "favour";

interface GiftPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: GiftType) => void;
  devMode?: boolean;
}

const BASE_OPTIONS: { type: GiftType; icon: string; label: string; description: string; devOnly?: boolean }[] = [
  {
    type: "envelope",
    icon: "🧧",
    label: "Red Envelope",
    description: "Send USDC in a surprise envelope",
  },
  {
    type: "gacha",
    icon: "🎰",
    label: "Gacha Envelope",
    description: "USDC + a mystery NFT inside",
    devOnly: true,
  },
  {
    type: "gold",
    icon: "🥇",
    label: "Gold Gift",
    description: "Send tokenized gold",
  },
  {
    type: "favour",
    icon: "📤",
    label: "Share a Favour",
    description: "Forward a favour to this chat",
  },
];

export function GiftPicker({ open, onClose, onSelect, devMode }: GiftPickerProps) {
  if (!open) return null;

  const options = BASE_OPTIONS.filter((o) => !o.devOnly || devMode);

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-4">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Send a Gift
          </p>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-2">
          {options.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => {
                onSelect(opt.type);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left active:scale-[0.99]"
            >
              <span className="text-2xl flex-shrink-0">{opt.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {opt.label}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {opt.description}
                </p>
              </div>
              <svg className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface EnvelopeComposerProps {
  open: boolean;
  onClose: () => void;
  onSend: (amount: number, message?: string) => void;
  type: "envelope" | "gacha";
}

const PRESET_AMOUNTS = [5, 10, 25, 50];
const GACHA_FEE = 5;

export function EnvelopeComposer({ open, onClose, onSend, type }: EnvelopeComposerProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  if (!open) return null;

  const numAmount = parseFloat(amount) || 0;
  const totalCost = type === "gacha" ? numAmount + GACHA_FEE : numAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{type === "gacha" ? "🎰" : "🧧"}</span>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {type === "gacha" ? "Gacha Envelope" : "Red Envelope"}
                </h3>
                {type === "gacha" && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">+${GACHA_FEE} gacha fee for mystery NFT</p>
                )}
              </div>
            </div>
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

          {/* Preset amounts */}
          <div className="flex gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  amount === preset.toString()
                    ? "bg-red-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Custom amount (USDC)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Message (optional)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Happy birthday! 🎂"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>

          {/* Total */}
          {type === "gacha" && numAmount > 0 && (
            <div className="rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-purple-600 dark:text-purple-400">Total cost</span>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                ${totalCost} USDC
              </span>
            </div>
          )}

          {/* Send */}
          <button
            onClick={() => {
              if (numAmount > 0) onSend(numAmount, message || undefined);
            }}
            disabled={numAmount <= 0}
            className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 ${
              type === "gacha"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            }`}
          >
            {numAmount > 0
              ? `Send ${type === "gacha" ? "Gacha" : "Red"} Envelope — $${type === "gacha" ? totalCost : numAmount}`
              : "Enter an amount"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Gold tier picker modal — replaces the old marketplace page as the in-chat purchase flow
interface GoldTierPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (amount: number) => void;
}

const GOLD_TIERS = [
  { label: "Gold Starter", amount: 0.25, shortDesc: "1/4 troy ounce" },
  { label: "Gold Classic", amount: 0.5, shortDesc: "1/2 troy ounce" },
  { label: "Gold Premium", amount: 1.0, shortDesc: "1 troy ounce" },
];

export function GoldTierPicker({ open, onClose, onSelect }: GoldTierPickerProps) {
  const [prices, setPrices] = useState<Record<number, string>>({});

  const fetchPrices = useCallback(async () => {
    for (const tier of GOLD_TIERS) {
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
            setPrices((prev) => ({
              ...prev,
              [tier.amount]: usdc.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }),
            }));
          }
        }
      } catch {
        // skip
      }
    }
  }, []);

  useEffect(() => {
    if (open) fetchPrices();
  }, [open, fetchPrices]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥇</span>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Send Gold Gift
            </h3>
          </div>
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
        <div className="p-3 space-y-2">
          {GOLD_TIERS.map((tier) => (
            <button
              key={tier.amount}
              type="button"
              onClick={() => {
                onSelect(tier.amount);
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400/50 dark:hover:border-amber-500/30 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-all text-left active:scale-[0.98]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {tier.label}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {tier.shortDesc}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {tier.amount} oz
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {prices[tier.amount] ? `≈ ${prices[tier.amount]}` : (
                    <span className="inline-block w-14 h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  )}
                </p>
              </div>
            </button>
          ))}
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center pt-1">
            GOLD (XAUT0) — 1 token = 1 troy ounce of gold
          </p>
        </div>
      </div>
    </div>
  );
}
