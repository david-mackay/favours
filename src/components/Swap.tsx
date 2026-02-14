"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana";
import { VersionedTransaction } from "@solana/web3.js";
import { TokenDevModal } from "@/components/TokenDevModal";
import {
  TokenDef,
  TOKENS,
  TokenSelectorModal,
  TokenButton,
} from "@/components/TokenSelector";

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function toAtomic(amount: number, decimals: number): string {
  return Math.round(amount * 10 ** decimals).toString();
}

function fromAtomic(amount: string, decimals: number): number {
  return parseInt(amount, 10) / 10 ** decimals;
}

export function Swap() {
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const [inputToken, setInputToken] = useState(TOKENS[0].symbol);
  const [outputToken, setOutputToken] = useState(TOKENS[1].symbol);
  const [amount, setAmount] = useState("");
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState("");
  const [quote, setQuote] = useState<{
    outAmount: string;
    outAmountFormatted: string;
    priceImpact?: number;
    feeBps?: number;
  } | null>(null);
  const [inputBalance, setInputBalance] = useState<string | null>(null);
  const [tokenModal, setTokenModal] = useState<"input" | "output" | null>(null);
  const [devModalOpen, setDevModalOpen] = useState(false);

  const inputTokenDef = TOKENS.find((t) => t.symbol === inputToken)!;
  const outputTokenDef = TOKENS.find((t) => t.symbol === outputToken)!;
  const inputMint = inputTokenDef.mint;
  const outputMint = outputTokenDef.mint;
  const inputDecimals = inputTokenDef.decimals;

  const fetchQuote = useCallback(async () => {
    const taker = walletProvider?.publicKey?.toString();
    if (!taker || !amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }

    try {
      const atomicAmount = toAtomic(parseFloat(amount), inputDecimals);
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: atomicAmount,
        taker,
      });

      const res = await fetch(`/api/swap/order?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setQuote(null);
        return;
      }

      if (data.errorCode || data.errorMessage) {
        setQuote(null);
        return;
      }

      const outputDecimals = outputTokenDef.decimals;
      setQuote({
        outAmount: data.outAmount,
        outAmountFormatted: fromAtomic(
          data.outAmount ?? "0",
          outputDecimals,
        ).toFixed(outputDecimals === 6 ? 2 : 4),
        priceImpact: data.priceImpact,
        feeBps: data.feeBps,
      });
    } catch {
      setQuote(null);
    }
  }, [
    walletProvider?.publicKey,
    amount,
    inputMint,
    outputMint,
    inputDecimals,
    outputTokenDef.decimals,
  ]);

  const quoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const addr = walletProvider?.publicKey?.toString();
    if (!addr) {
      setInputBalance(null);
      return;
    }
    fetch(`/api/swap/holdings?address=${encodeURIComponent(addr)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          setInputBalance(null);
          return;
        }
        if (inputToken === "SOL") {
          const sol = data.uiAmount ?? 0;
          setInputBalance(sol.toFixed(4));
        } else {
          const tokens = data.tokens?.[inputMint];
          const bal = tokens?.[0]?.uiAmount ?? 0;
          setInputBalance(bal.toFixed(2));
        }
      })
      .catch(() => setInputBalance(null));
  }, [walletProvider?.publicKey, inputToken, inputMint]);

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    if (!walletProvider?.publicKey) return;

    if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current);
    quoteTimeoutRef.current = setTimeout(fetchQuote, 400);
    return () => {
      if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current);
    };
  }, [amount, walletProvider?.publicKey, fetchQuote]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setQuote(null);
  };

  const handleSwapTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setQuote(null);
  };

  const handleTokenSelect = (symbol: string, which: "input" | "output") => {
    if (which === "input") {
      setInputToken(symbol);
      if (symbol === outputToken) setOutputToken(inputToken);
    } else {
      setOutputToken(symbol);
      if (symbol === inputToken) setInputToken(outputToken);
    }
    setQuote(null);
    if (amount) setTimeout(fetchQuote, 100);
  };

  const handleSwap = async () => {
    const taker = walletProvider?.publicKey?.toString();
    if (!taker || !amount || parseFloat(amount) <= 0 || !quote) return;

    setSwapping(true);
    setError(null);

    try {
      setStep("Fetching quote...");
      const atomicAmount = toAtomic(parseFloat(amount), inputDecimals);
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: atomicAmount,
        taker,
      });

      const orderRes = await fetch(`/api/swap/order?${params}`);
      const orderData = await orderRes.json();

      if (!orderRes.ok || orderData.errorCode || orderData.errorMessage) {
        throw new Error(
          orderData.errorMessage ??
            orderData.error ??
            "Failed to get swap quote",
        );
      }

      if (!orderData.transaction) {
        throw new Error(
          orderData.errorMessage ??
            "No transaction returned. Check your balance.",
        );
      }

      setStep("Sign the transaction in your wallet...");

      const txBuf = base64ToUint8Array(orderData.transaction);
      const tx = VersionedTransaction.deserialize(txBuf);

      const signedTx = await walletProvider.signTransaction(tx);
      const signedB64 = uint8ArrayToBase64(signedTx.serialize());

      setStep("Executing swap...");

      const executeRes = await fetch("/api/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedTransaction: signedB64,
          requestId: orderData.requestId,
        }),
      });

      const executeData = await executeRes.json();

      if (!executeRes.ok) {
        throw new Error(executeData.error ?? "Swap execution failed");
      }

      if (executeData.status !== "Success") {
        throw new Error(executeData.error ?? "Swap failed on-chain");
      }

      setStep("");
      setAmount("");
      setQuote(null);
      window.open(
        `https://solscan.io/tx/${executeData.signature}`,
        "_blank",
        "noopener",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setSwapping(false);
    }
  };

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation shrink-0"
              aria-label="Back to feed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 truncate">
              Swap
            </h2>
          </div>
          {isDev && (
            <button
              type="button"
              onClick={() => setDevModalOpen(true)}
              className="px-2 py-1.5 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors shrink-0"
            >
              Token dev
            </button>
          )}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Powered by Jupiter Ultra. Referral fees support favours.xyz.
        </p>

        {/* Input */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-3">
          <div className="flex justify-between items-center gap-2">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">
              You pay
            </label>
            {inputBalance != null && walletProvider && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                Balance: {inputBalance} {inputToken}
                {inputToken === "USDC" && ` (≈ $${inputBalance})`}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 w-full py-3 sm:py-2 bg-transparent text-xl sm:text-lg font-medium text-zinc-900 dark:text-zinc-50 outline-none placeholder:text-zinc-400"
            />
            <TokenButton
              token={inputTokenDef}
              onClick={() => setTokenModal("input")}
            />
          </div>
        </div>

        {/* Swap direction button */}
        <div className="flex justify-center -my-1">
          <button
            type="button"
            onClick={handleSwapTokens}
            className="p-3 rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors touch-manipulation active:scale-95"
            aria-label="Swap tokens"
          >
            <svg
              className="w-6 h-6 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* Output */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-3">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            You receive
          </label>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-center">
            <span className="flex-1 min-w-0 text-xl sm:text-lg font-medium text-zinc-900 dark:text-zinc-50 py-2 sm:py-0">
              {quote?.outAmountFormatted ?? "—"}
            </span>
            <TokenButton
              token={outputTokenDef}
              onClick={() => setTokenModal("output")}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {step && (
          <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-800 px-4 py-3 text-sm text-violet-700 dark:text-violet-300">
            {step}
          </div>
        )}

        <button
          onClick={handleSwap}
          disabled={
            !walletProvider ||
            swapping ||
            !amount ||
            parseFloat(amount) <= 0 ||
            !quote
          }
          className="w-full py-4 sm:py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-base sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation active:scale-[0.99]"
        >
          {swapping ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Swapping...
            </>
          ) : !walletProvider ? (
            "Sign in"
          ) : (
            "Swap"
          )}
        </button>
      </div>

      <TokenSelectorModal
        open={tokenModal !== null}
        onClose={() => setTokenModal(null)}
        tokens={TOKENS}
        selectedSymbol={tokenModal === "input" ? inputToken : outputToken}
        onSelect={(sym) => tokenModal && handleTokenSelect(sym, tokenModal)}
      />

      {isDev && (
        <TokenDevModal
          open={devModalOpen}
          onClose={() => setDevModalOpen(false)}
        />
      )}
    </div>
  );
}
