"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useChat, fetchTapestryProfile, type ChatMessage, type TapestryProfile } from "@/hooks/useChat";

interface ChatViewProps {
  partnerWallet: string;
  myWallet: string;
}

function truncateWallet(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function formatMessageTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function shouldShowDateSeparator(
  current: string,
  previous: string | null,
): boolean {
  if (!previous) return true;
  return (
    new Date(current).toDateString() !== new Date(previous).toDateString()
  );
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function GiftBubble({ msg }: { msg: ChatMessage }) {
  const isNft = msg.type === "gift_nft";
  const label = isNft
    ? msg.nft_name ?? "an NFT"
    : `${msg.amount ?? ""} ${msg.token_symbol ?? "tokens"}`.trim();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400">
        <span>🎁</span>
        <span>Sent {label}</span>
      </div>
      {msg.media_url && (
        <img
          src={msg.media_url}
          alt=""
          className="rounded-lg max-w-[200px] max-h-[200px] object-cover"
        />
      )}
      {msg.content && (
        <p className="text-sm">{msg.content}</p>
      )}
      {msg.transaction_hash && (
        <a
          href={`https://solscan.io/tx/${msg.transaction_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-violet-500 hover:underline"
        >
          View transaction &rarr;
        </a>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  isMine,
}: {
  msg: ChatMessage;
  isMine: boolean;
}) {
  const isGift = msg.type === "gift_token" || msg.type === "gift_nft";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
          isMine
            ? "bg-violet-600 text-white rounded-br-md"
            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md"
        }`}
      >
        {isGift ? (
          <GiftBubble msg={msg} />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        )}
        <p
          className={`text-[10px] mt-1 ${
            isMine
              ? "text-violet-200"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {formatMessageTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

export function ChatView({ partnerWallet, myWallet }: ChatViewProps) {
  const { connected, messages, sendMessage } = useChat(partnerWallet);
  const [input, setInput] = useState("");
  const [partnerProfile, setPartnerProfile] = useState<TapestryProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTapestryProfile(partnerWallet).then(setPartnerProfile);
  }, [partnerWallet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const partnerName = partnerProfile?.username ?? truncateWallet(partnerWallet);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />

      {/* Chat header */}
      <div className="sticky top-14 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 flex items-center gap-3 h-12">
          <Link
            href="/messages"
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {partnerProfile?.image ? (
            <img
              src={partnerProfile.image}
              alt={partnerName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm font-medium text-zinc-500">
              {partnerName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {partnerName}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono truncate">
              {truncateWallet(partnerWallet)}
            </p>
          </div>
          {!connected && (
            <span className="ml-auto text-xs text-amber-500">Connecting...</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 mx-auto w-full max-w-3xl"
      >
        {messages.length === 0 && connected && (
          <div className="text-center py-16 space-y-2">
            <div className="text-3xl">👋</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Start a conversation
            </p>
          </div>
        )}

        <div className="space-y-2">
          {messages.map((msg, i) => {
            const prevCreatedAt = i > 0 ? messages[i - 1].created_at : null;
            const showDate = shouldShowDateSeparator(
              msg.created_at,
              prevCreatedAt,
            );
            const isMine = msg.sender_wallet === myWallet;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center py-3">
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                <MessageBubble msg={msg} isMine={isMine} />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pb-20 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="h-10 w-10 flex-shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
