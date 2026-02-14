"use client";

import { useState } from "react";
import { useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_DECIMALS = 6;

interface PayBountyProps {
  favourId: string;
  recipientWallet: string;
  amount: number;
  token: string;
  onComplete: (signature: string) => void;
}

export function PayBounty({
  favourId,
  recipientWallet,
  amount,
  token,
  onComplete,
}: PayBountyProps) {
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>("");

  const handlePay = async () => {
    if (!walletProvider) {
      setError("Sign in to send your thank-you");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      setStep("Building transaction...");

      let rpcUrl =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
        "https://api.mainnet-beta.solana.com";
      const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
      if (heliusKey && rpcUrl.includes("helius")) {
        rpcUrl = rpcUrl.includes("?")
          ? `${rpcUrl}&api-key=${heliusKey}`
          : `${rpcUrl}?api-key=${heliusKey}`;
      }
      const connection = new Connection(rpcUrl, "confirmed");

      const fromPubkey = new PublicKey(walletProvider.publicKey!.toString());
      const toPubkey = new PublicKey(recipientWallet);

      let tx: Transaction;

      if (token === "SOL") {
        const lamports = Math.round(amount * LAMPORTS_PER_SOL);
        tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports,
          }),
        );
      } else if (token === "USDC") {
        const atomicAmount = BigInt(
          Math.round(amount * 10 ** USDC_DECIMALS).toString(),
        );
        const fromAta = await getAssociatedTokenAddress(
          USDC_MINT,
          fromPubkey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        const toAta = await getAssociatedTokenAddress(
          USDC_MINT,
          toPubkey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        const toAccountInfo = await connection.getAccountInfo(toAta);
        const ix: Parameters<Transaction["add"]>[0][] = [];
        if (!toAccountInfo) {
          ix.push(
            createAssociatedTokenAccountInstruction(
              fromPubkey,
              toAta,
              toPubkey,
              USDC_MINT,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );
        }
        ix.push(
          createTransferInstruction(
            fromAta,
            toAta,
            fromPubkey,
            atomicAmount,
            [],
            TOKEN_PROGRAM_ID,
          ),
        );
        tx = new Transaction().add(...ix);
      } else {
        throw new Error(`Unsupported token: ${token}`);
      }

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = fromPubkey;

      setStep("Confirm in your wallet...");

      const signedTx = await walletProvider.signTransaction(tx);

      setStep("Sending transaction...");
      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
      );

      setStep("Confirming transaction...");
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );

      setStep("Recording completion...");
      const res = await fetch(`/api/favours/${favourId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionSignature: signature }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ||
            "Payment sent but failed to record. Signature: " + signature,
        );
      }

      setStep("");
      onComplete(signature);
    } catch (e) {
      console.error("Payment error:", e);
      setError(
        e instanceof Error ? e.message : "Payment failed. Please try again.",
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {step && (
        <div className="rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-800 px-4 py-3 text-sm text-violet-700 dark:text-violet-300">
          {step}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={paying}
        className="w-full py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {paying ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
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
            Processing...
          </>
        ) : (
          <>
            Send thank-you ({amount} {token})
          </>
        )}
      </button>
    </div>
  );
}
