"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchChatToken,
  fetchConversations,
  fetchTapestryProfile,
  type Conversation,
  type TapestryProfile,
} from "@/hooks/useChat";

interface ShareFavourModalProps {
  open: boolean;
  onClose: () => void;
  favourId: string;
  favourTitle: string;
  currentWallet: string;
  onShare: (recipientWallet: string, message?: string) => void;
}

function truncateWallet(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function ShareFavourModal({
  open,
  onClose,
  favourId,
  favourTitle,
  currentWallet,
  onShare,
}: ShareFavourModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, TapestryProfile>>({});
  const [loading, setLoading] = useState(true);
  const [walletInput, setWalletInput] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const token = await fetchChatToken();
      if (!token) return;
      const convs = await fetchConversations(token, currentWallet);
      setConversations(convs);

      const profileMap: Record<string, TapestryProfile> = {};
      await Promise.all(
        convs.slice(0, 20).map(async (c) => {
          profileMap[c.partnerWallet] = await fetchTapestryProfile(
            c.partnerWallet
          );
        })
      );
      setProfiles(profileMap);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [currentWallet]);

  useEffect(() => {
    if (open) {
      loadConversations();
      setSelected(null);
      setMessage("");
      setWalletInput("");
    }
  }, [open, loadConversations]);

  const handleSend = async () => {
    const recipient = selected || walletInput.trim();
    if (!recipient) return;
    setSending(true);
    onShare(recipient, message || undefined);
    setTimeout(() => {
      setSending(false);
      onClose();
    }, 300);
  };

  if (!open) return null;

  const recipient = selected || walletInput.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Share Favour
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {favourTitle}
            </p>
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Wallet input */}
          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Or enter wallet address
            </label>
            <input
              type="text"
              value={walletInput}
              onChange={(e) => {
                setWalletInput(e.target.value);
                if (e.target.value.trim()) setSelected(null);
              }}
              placeholder="Wallet address..."
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          {/* Recent conversations */}
          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Recent conversations
            </label>
            {loading ? (
              <div className="space-y-2 mt-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                No recent conversations. Enter a wallet address above.
              </p>
            ) : (
              <div className="space-y-1 mt-2">
                {conversations.map((conv) => {
                  const profile = profiles[conv.partnerWallet];
                  const name = profile?.username ?? truncateWallet(conv.partnerWallet);
                  const isSelected = selected === conv.partnerWallet;

                  return (
                    <button
                      key={conv.partnerWallet}
                      type="button"
                      onClick={() => {
                        setSelected(conv.partnerWallet);
                        setWalletInput("");
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                        isSelected
                          ? "bg-violet-50 dark:bg-violet-500/20 ring-1 ring-violet-300 dark:ring-violet-700"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {profile?.image ? (
                          <img src={profile.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm text-zinc-400">
                            {name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {profile?.username ? `@${profile.username}` : name}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono truncate">
                          {truncateWallet(conv.partnerWallet)}
                        </p>
                      </div>
                      {isSelected && (
                        <svg className="w-5 h-5 text-violet-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional message */}
          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Add a message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Check out this favour..."
              rows={2}
              className="mt-1 w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={handleSend}
            disabled={!recipient || sending}
            className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
                Send to {selected ? (profiles[selected]?.username ? `@${profiles[selected].username}` : truncateWallet(selected)) : walletInput ? truncateWallet(walletInput) : "..."}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
