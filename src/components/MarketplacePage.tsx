"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GoldGiftCard, GOLD_TIERS } from "@/components/GoldGiftCard";
import { ShareFavourModal } from "@/components/ShareFavourModal";

interface MarketplacePageProps {
  walletAddress: string;
}

export function MarketplacePage({ walletAddress }: MarketplacePageProps) {
  const router = useRouter();
  const [selectedGoldAmount, setSelectedGoldAmount] = useState<number | null>(null);
  const [recipientModal, setRecipientModal] = useState(false);

  const handleGoldSelect = (amount: number) => {
    setSelectedGoldAmount(amount);
    setRecipientModal(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Gift Marketplace</h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
            Send tokenized gold as a premium gift. Real value that holds over time, delivered instantly on Solana.
          </p>
        </div>

        {/* Gold gift tiers */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥇</span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Tokenized Gold</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                XAUT0 / GOLD — 1 token = 1 troy ounce of gold
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GOLD_TIERS.map((tier) => (
              <GoldGiftCard
                key={tier.amount}
                tier={tier}
                onSelect={handleGoldSelect}
              />
            ))}
          </div>
        </section>

        {/* Envelope promo section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧧</span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Red Envelopes</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Send USDC in a surprise red envelope — open it with an animation
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-950/30 p-6 space-y-3 cursor-pointer hover:border-red-300 dark:hover:border-red-500/40 transition-colors"
              onClick={() => router.push("/messages")}
            >
              <div className="text-3xl">🧧</div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Red Envelope</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Pick any USDC amount and send it as a sealed red envelope in chat. The recipient taps to reveal.
              </p>
              <div className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                Send in Messages →
              </div>
            </div>
            <div
              className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 p-6 space-y-3"
            >
              <div className="text-3xl opacity-40">🎰</div>
              <h3 className="text-base font-bold text-zinc-400 dark:text-zinc-500">Gacha Envelope</h3>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Coming soon — red envelope plus a mystery NFT from our curated collection.
              </p>
              <div className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                Coming soon
              </div>
            </div>
          </div>
        </section>
      </main>

      {recipientModal && selectedGoldAmount && (
        <GoldRecipientModal
          open={recipientModal}
          onClose={() => setRecipientModal(false)}
          amount={selectedGoldAmount}
          currentWallet={walletAddress}
        />
      )}
    </div>
  );
}

function GoldRecipientModal({
  open,
  onClose,
  amount,
  currentWallet,
}: {
  open: boolean;
  onClose: () => void;
  amount: number;
  currentWallet: string;
}) {
  const router = useRouter();

  return (
    <ShareFavourModal
      open={open}
      onClose={onClose}
      favourId=""
      favourTitle={`Send ${amount} oz Gold Gift`}
      currentWallet={currentWallet}
      onShare={(recipientWallet) => {
        router.push(`/messages/${recipientWallet}?gift=gold&amount=${amount}`);
        onClose();
      }}
    />
  );
}
