"use client";

import { useState } from "react";

interface EnvelopeBubbleProps {
  messageId: string;
  amount: string | null;
  transactionHash: string | null;
  isOpened: boolean;
  isMine: boolean;
  isRecipient: boolean;
  content: string | null;
  onOpened?: () => void;
}

export function EnvelopeBubble({
  messageId,
  amount,
  transactionHash,
  isOpened,
  isMine,
  isRecipient,
  content,
  onOpened,
}: EnvelopeBubbleProps) {
  const [opened, setOpened] = useState(isOpened);
  const [animating, setAnimating] = useState(false);
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    if (opened || animating || !isRecipient) return;
    setOpening(true);
    try {
      const res = await fetch(`/api/gifts/envelope/${messageId}/open`, {
        method: "POST",
      });
      if (res.ok) {
        setAnimating(true);
        setTimeout(() => {
          setOpened(true);
          setAnimating(false);
          onOpened?.();
        }, 1200);
      }
    } catch {
      // silently fail
    } finally {
      setOpening(false);
    }
  };

  if (opened || (isMine && !isRecipient)) {
    return (
      <div className="space-y-1.5">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600 to-red-800 p-4 min-w-[200px]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 text-4xl">🧧</div>
          </div>
          <div className="relative z-10">
            <p className="text-xs text-red-200 font-medium mb-1">Red Envelope</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">${amount}</span>
              <span className="text-sm text-red-200">USDC</span>
            </div>
            {content && (
              <p className="text-sm text-red-100 mt-2 whitespace-pre-wrap">{content}</p>
            )}
            {isMine && opened && (
              <p className="text-[10px] text-red-300 mt-2">Opened</p>
            )}
          </div>
        </div>
        {transactionHash && (
          <a
            href={`https://solscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-red-400 hover:underline"
          >
            View transaction →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleOpen}
        disabled={opening || animating || !isRecipient}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600 to-red-800 p-4 min-w-[200px] text-left transition-transform active:scale-[0.98] disabled:cursor-default"
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Envelope flap */}
        <div
          className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-red-700 to-red-600 origin-top transition-transform duration-500 ${
            animating ? "envelope-flap-open" : ""
          }`}
          style={{
            clipPath: "polygon(0 0, 50% 100%, 100% 0)",
          }}
        />

        {/* Golden seal */}
        <div
          className={`absolute top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg transition-all duration-500 ${
            animating ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <span className="text-sm">🎁</span>
        </div>

        {/* Content */}
        <div className={`relative z-10 pt-8 transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
          <div className="text-center">
            <p className="text-base font-bold text-amber-200">Red Envelope</p>
            <p className="text-xs text-red-200 mt-1">
              {isRecipient ? "Tap to open" : "Waiting to be opened..."}
            </p>
          </div>
          {content && (
            <p className="text-sm text-red-100 mt-2 text-center whitespace-pre-wrap">{content}</p>
          )}
        </div>

        {/* Light burst on open */}
        {animating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="envelope-burst w-32 h-32 rounded-full bg-amber-400/30" />
            <div className="absolute text-3xl font-bold text-white envelope-amount-reveal">
              ${amount}
            </div>
          </div>
        )}
      </button>

      <style jsx>{`
        @keyframes flapOpen {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-180deg); opacity: 0; }
        }
        @keyframes burst {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes amountReveal {
          0% { transform: translateY(20px); opacity: 0; }
          50% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-5px); opacity: 1; }
        }
        .envelope-flap-open {
          animation: flapOpen 0.6s ease-in-out forwards;
        }
        .envelope-burst {
          animation: burst 1s ease-out forwards;
        }
        .envelope-amount-reveal {
          animation: amountReveal 0.8s ease-out 0.3s both;
        }
      `}</style>
    </div>
  );
}
