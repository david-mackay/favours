"use client";

import { useState } from "react";

interface GachaBubbleProps {
  messageId: string;
  amount: string | null;
  transactionHash: string | null;
  isOpened: boolean;
  isMine: boolean;
  isRecipient: boolean;
  content: string | null;
  nftName: string | null;
  mediaUrl: string | null;
  onOpened?: () => void;
}

const RARITY_STYLES: Record<string, { glow: string; border: string; label: string }> = {
  common: {
    glow: "shadow-zinc-400/30",
    border: "border-zinc-400/50",
    label: "Common",
  },
  rare: {
    glow: "shadow-blue-500/40",
    border: "border-blue-400/50",
    label: "Rare",
  },
  legendary: {
    glow: "shadow-amber-400/50",
    border: "border-amber-400/50",
    label: "Legendary",
  },
};

export function GachaBubble({
  messageId,
  amount,
  transactionHash,
  isOpened,
  isMine,
  isRecipient,
  content,
  nftName,
  mediaUrl,
  onOpened,
}: GachaBubbleProps) {
  const [opened, setOpened] = useState(isOpened);
  const [animating, setAnimating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [revealedNft, setRevealedNft] = useState<{
    name: string;
    image: string;
    rarity: string;
  } | null>(
    isOpened && nftName
      ? { name: nftName, image: mediaUrl ?? "", rarity: "common" }
      : null
  );

  const handleClaim = async () => {
    if (opened || animating || !isRecipient) return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/gifts/gacha/${messageId}/claim`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setAnimating(true);
        setTimeout(() => {
          setRevealedNft({
            name: data.nft?.name ?? "Mystery NFT",
            image: data.nft?.imageUrl ?? "",
            rarity: data.nft?.rarity ?? "common",
          });
          setOpened(true);
          setAnimating(false);
          onOpened?.();
        }, 2000);
      }
    } catch {
      // silently fail
    } finally {
      setClaiming(false);
    }
  };

  const rarity = revealedNft?.rarity ?? "common";
  const rarityStyle = RARITY_STYLES[rarity] ?? RARITY_STYLES.common;

  if (opened && revealedNft) {
    return (
      <div className="space-y-2">
        <div
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900 to-indigo-950 p-4 min-w-[220px] shadow-lg ${rarityStyle.glow}`}
        >
          <div className="gacha-opened-shimmer absolute inset-0 opacity-20" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-purple-300 font-medium">Gacha Envelope</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                rarity === "legendary"
                  ? "bg-amber-400/20 text-amber-300"
                  : rarity === "rare"
                  ? "bg-blue-400/20 text-blue-300"
                  : "bg-zinc-400/20 text-zinc-300"
              }`}>
                {rarityStyle.label}
              </span>
            </div>

            {revealedNft.image && (
              <div className={`rounded-lg overflow-hidden border-2 ${rarityStyle.border}`}>
                <img
                  src={revealedNft.image}
                  alt={revealedNft.name}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            <div>
              <p className="text-sm font-bold text-white">{revealedNft.name}</p>
              {amount && (
                <p className="text-xs text-purple-300 mt-0.5">+ ${amount} USDC</p>
              )}
            </div>

            {content && (
              <p className="text-sm text-purple-200 whitespace-pre-wrap">{content}</p>
            )}
          </div>
        </div>
        {transactionHash && (
          <a
            href={`https://solscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-purple-400 hover:underline"
          >
            View transaction →
          </a>
        )}

        <style jsx>{`
          @keyframes gachaShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .gacha-opened-shimmer {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.1) 50%,
              transparent 100%
            );
            background-size: 200% 100%;
            animation: gachaShimmer 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleClaim}
        disabled={claiming || animating || !isRecipient}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900 p-5 min-w-[220px] text-left transition-transform active:scale-[0.98] disabled:cursor-default"
      >
        {/* Animated border shimmer */}
        <div className="absolute inset-0 gacha-border-shimmer rounded-xl" />

        {/* Sparkle particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="gacha-sparkle absolute w-1 h-1 rounded-full bg-amber-300"
              style={{
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className={`relative z-10 text-center transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
          <div className="text-3xl mb-2">🎰</div>
          <p className="text-base font-bold text-amber-200">Gacha Envelope</p>
          <p className="text-xs text-purple-300 mt-1">Mystery NFT inside</p>
          {amount && (
            <p className="text-xs text-purple-300 mt-0.5">+ ${amount} USDC</p>
          )}
          <p className="text-xs text-purple-200/60 mt-3">
            {isRecipient ? "Tap to reveal" : isMine ? "Waiting to be opened..." : ""}
          </p>
        </div>

        {/* Reveal animation */}
        {animating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="gacha-reveal-burst w-40 h-40 rounded-full bg-amber-400/20" />
            <div className="absolute gacha-reveal-spin">
              <div className="text-5xl">✨</div>
            </div>
          </div>
        )}
      </button>

      {content && !animating && (
        <p className="text-sm whitespace-pre-wrap break-words opacity-80 mt-1">{content}</p>
      )}

      <style jsx>{`
        @keyframes borderShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes revealBurst {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes revealSpin {
          0% { transform: rotate(0deg) scale(0); opacity: 0; }
          50% { transform: rotate(180deg) scale(1.5); opacity: 1; }
          100% { transform: rotate(360deg) scale(1); opacity: 1; }
        }
        .gacha-border-shimmer {
          background: linear-gradient(
            45deg,
            rgba(168, 85, 247, 0.4),
            rgba(251, 191, 36, 0.4),
            rgba(168, 85, 247, 0.4),
            rgba(251, 191, 36, 0.4)
          );
          background-size: 300% 300%;
          animation: borderShimmer 3s ease infinite;
          padding: 2px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          -webkit-mask-composite: xor;
        }
        .gacha-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        .gacha-reveal-burst {
          animation: revealBurst 1.5s ease-out forwards;
        }
        .gacha-reveal-spin {
          animation: revealSpin 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
