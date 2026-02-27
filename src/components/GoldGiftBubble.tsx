"use client";

interface GoldGiftBubbleProps {
  amount: string | null;
  transactionHash: string | null;
  content: string | null;
  isMine: boolean;
}

const GOLD_TIERS: Record<string, string> = {
  "0.25": "Gold Starter (1/4 oz)",
  "0.5": "Gold Classic (1/2 oz)",
  "1": "Gold Premium (1 oz)",
};

function getTierLabel(amount: string | null): string {
  if (!amount) return "Gold Gift";
  const key = parseFloat(amount).toString();
  return GOLD_TIERS[key] ?? `${amount} oz Gold`;
}

export function GoldGiftBubble({
  amount,
  transactionHash,
  content,
  isMine,
}: GoldGiftBubbleProps) {
  const tierLabel = getTierLabel(amount);

  return (
    <div className="space-y-1.5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-700 via-yellow-600 to-amber-800 p-4 min-w-[200px]">
        {/* Shimmer sweep */}
        <div className="gold-shimmer absolute inset-0" />

        {/* Gold particle accents */}
        <div className="absolute top-2 right-3 text-2xl opacity-60">🥇</div>

        <div className="relative z-10">
          <p className="text-xs text-amber-200 font-medium">Gold Gift</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-white">{amount ?? "?"}</span>
            <span className="text-sm text-amber-200">oz GOLD</span>
          </div>
          <p className="text-xs text-amber-300/80 mt-0.5">{tierLabel}</p>
          {content && (
            <p className="text-sm text-amber-100 mt-2 whitespace-pre-wrap">{content}</p>
          )}
        </div>
      </div>
      {transactionHash && (
        <a
          href={`https://solscan.io/tx/${transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-amber-500 hover:underline"
        >
          View transaction →
        </a>
      )}

      <style jsx>{`
        @keyframes goldSweep {
          0% { transform: translateX(-100%) rotate(15deg); }
          100% { transform: translateX(200%) rotate(15deg); }
        }
        .gold-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 50%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.15),
            transparent
          );
          animation: goldSweep 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
