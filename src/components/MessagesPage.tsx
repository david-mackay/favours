"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import {
  fetchChatToken,
  fetchConversations,
  fetchTapestryProfiles,
  type Conversation,
  type TapestryProfile,
} from "@/hooks/useChat";

interface MessagesPageProps {
  walletAddress: string;
}

function truncateWallet(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function previewText(conv: Conversation) {
  if (conv.lastMessageType === "gift_token") return "Sent tokens";
  if (conv.lastMessageType === "gift_nft") return "Sent an NFT";
  if (conv.lastMessageType === "favour_share") return "Shared a favour";
  if (conv.lastMessageType === "gift_envelope") return "🧧 Sent a red envelope";
  if (conv.lastMessageType === "gift_gacha") return "🎰 Sent a gacha envelope";
  return conv.lastMessage ?? "";
}

function Avatar({ profile, wallet }: { profile: TapestryProfile | undefined; wallet: string }) {
  if (profile?.image) {
    return (
      <img
        src={profile.image}
        alt={profile.username ?? wallet}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <span className="text-lg text-zinc-400">
      {(profile?.username ?? wallet).slice(0, 1).toUpperCase()}
    </span>
  );
}

export function MessagesPage({ walletAddress }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, TapestryProfile>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await fetchChatToken();
      if (!token) return;
      const convs = await fetchConversations(token, walletAddress);
      setConversations(convs);

      if (convs.length > 0) {
        const wallets = convs.map((c) => c.partnerWallet);
        const profileMap = await fetchTapestryProfiles(wallets);
        setProfiles(profileMap);
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Messages
        </h1>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">💬</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No conversations yet
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Visit a profile and tap &ldquo;Message&rdquo; to start chatting.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => {
              const profile = profiles[conv.partnerWallet];
              const displayName =
                profile?.username ?? truncateWallet(conv.partnerWallet);

              return (
                <Link
                  key={conv.partnerWallet}
                  href={`/messages/${conv.partnerWallet}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    <Avatar profile={profile} wallet={conv.partnerWallet} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {displayName}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                        {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {conv.lastSenderWallet === walletAddress ? "You: " : ""}
                        {previewText(conv)}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
