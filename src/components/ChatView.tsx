"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana";
import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Navbar } from "@/components/Navbar";
import { useChat, fetchTapestryProfile, type ChatMessage, type TapestryProfile } from "@/hooks/useChat";
import { GiftPicker, EnvelopeComposer, GoldTierPicker, type GiftType } from "@/components/GiftPicker";
import { FavourShareBubble } from "@/components/FavourShareBubble";
import { EnvelopeBubble } from "@/components/EnvelopeBubble";
import { GachaBubble } from "@/components/GachaBubble";
import { GoldGiftBubble } from "@/components/GoldGiftBubble";
import { FavourPickerModal } from "@/components/FavourPickerModal";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_DECIMALS = 6;
const GOLD_MINT = "AymATz4TCL9sWNEEV9Kvyz45CHVhDZ6kUgjTJPzLpU9P";

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

function shouldShowDateSeparator(current: string, previous: string | null): boolean {
  if (!previous) return true;
  return new Date(current).toDateString() !== new Date(previous).toDateString();
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
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
        <img src={msg.media_url} alt="" className="rounded-lg max-w-[200px] max-h-[200px] object-cover" />
      )}
      {msg.content && <p className="text-sm">{msg.content}</p>}
      {msg.transaction_hash && (
        <a
          href={`https://solscan.io/tx/${msg.transaction_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-violet-500 hover:underline"
        >
          View transaction →
        </a>
      )}
    </div>
  );
}

function MessageContent({
  msg,
  isMine,
  myWallet,
}: {
  msg: ChatMessage;
  isMine: boolean;
  myWallet: string;
}) {
  const isGift = msg.type === "gift_token" || msg.type === "gift_nft";
  const isGoldGift = msg.type === "gift_token" && msg.mint_address === GOLD_MINT;

  if (msg.type === "favour_share" && msg.favour_id) {
    return <FavourShareBubble favourId={msg.favour_id} content={msg.content} isMine={isMine} />;
  }

  if (msg.type === "gift_envelope") {
    return (
      <EnvelopeBubble
        messageId={msg.id}
        amount={msg.amount}
        transactionHash={msg.transaction_hash}
        isOpened={msg.is_opened}
        isMine={isMine}
        isRecipient={msg.receiver_wallet === myWallet}
        content={msg.content}
      />
    );
  }

  if (msg.type === "gift_gacha") {
    return (
      <GachaBubble
        messageId={msg.id}
        amount={msg.amount}
        transactionHash={msg.transaction_hash}
        isOpened={msg.is_opened}
        isMine={isMine}
        isRecipient={msg.receiver_wallet === myWallet}
        content={msg.content}
        nftName={msg.nft_name}
        mediaUrl={msg.media_url}
      />
    );
  }

  if (isGoldGift) {
    return (
      <GoldGiftBubble
        amount={msg.amount}
        transactionHash={msg.transaction_hash}
        content={msg.content}
        isMine={isMine}
      />
    );
  }

  if (isGift) {
    return <GiftBubble msg={msg} />;
  }

  return (
    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
  );
}

function MessageBubble({
  msg,
  isMine,
  myWallet,
}: {
  msg: ChatMessage;
  isMine: boolean;
  myWallet: string;
}) {
  const isSpecial =
    msg.type === "gift_envelope" ||
    msg.type === "gift_gacha" ||
    (msg.type === "gift_token" && msg.mint_address === GOLD_MINT);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
          isSpecial
            ? "bg-transparent p-0"
            : isMine
            ? "bg-violet-600 text-white rounded-br-md"
            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md"
        }`}
      >
        <MessageContent msg={msg} isMine={isMine} myWallet={myWallet} />
        {!isSpecial && (
          <p
            className={`text-[10px] mt-1 ${
              isMine ? "text-violet-200" : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {formatMessageTime(msg.created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

export function ChatView({ partnerWallet, myWallet }: ChatViewProps) {
  const searchParams = useSearchParams();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const { connected, messages, sendMessage, sendFavourShare, sendEnvelope } = useChat(partnerWallet);
  const [input, setInput] = useState("");
  const [partnerProfile, setPartnerProfile] = useState<TapestryProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [envelopeComposerOpen, setEnvelopeComposerOpen] = useState(false);
  const [envelopeType, setEnvelopeType] = useState<"envelope" | "gacha">("envelope");
  const [goldPickerOpen, setGoldPickerOpen] = useState(false);
  const [favourPickerOpen, setFavourPickerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [txStep, setTxStep] = useState("");
  const [devMode, setDevMode] = useState(false);

  // Hidden dev mode: type "/devmode" in chat input to toggle
  useEffect(() => {
    if (input.trim().toLowerCase() === "/devmode") {
      setDevMode((prev) => !prev);
      setInput("");
    }
  }, [input]);

  useEffect(() => {
    fetchTapestryProfile(partnerWallet).then(setPartnerProfile);
  }, [partnerWallet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle deep links from favour share or marketplace
  useEffect(() => {
    const shareFavourId = searchParams.get("shareFavour");
    const shareMsg = searchParams.get("shareMsg");
    if (shareFavourId && connected) {
      sendFavourShare(shareFavourId, shareMsg ?? undefined);
      window.history.replaceState(null, "", `/messages/${partnerWallet}`);
    }
  }, [searchParams, connected, partnerWallet, sendFavourShare]);

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

  const handleGiftSelect = (type: GiftType) => {
    if (type === "envelope" || type === "gacha") {
      setEnvelopeType(type);
      setEnvelopeComposerOpen(true);
    } else if (type === "favour") {
      setFavourPickerOpen(true);
    } else if (type === "gold") {
      setGoldPickerOpen(true);
    }
  };

  const handleEnvelopeSend = useCallback(
    async (amount: number, message?: string) => {
      if (!walletProvider?.publicKey) return;
      setEnvelopeComposerOpen(false);
      setSending(true);

      try {
        setTxStep("Building transaction...");
        let rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
        const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
        if (heliusKey && rpcUrl.includes("helius")) {
          rpcUrl = rpcUrl.includes("?") ? `${rpcUrl}&api-key=${heliusKey}` : `${rpcUrl}?api-key=${heliusKey}`;
        }
        const connection = new Connection(rpcUrl, "confirmed");
        const fromPubkey = new PublicKey(walletProvider.publicKey.toString());
        const toPubkey = new PublicKey(partnerWallet);

        const atomicAmount = BigInt(Math.round(amount * 10 ** USDC_DECIMALS).toString());
        const fromAta = await getAssociatedTokenAddress(USDC_MINT, fromPubkey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
        const toAta = await getAssociatedTokenAddress(USDC_MINT, toPubkey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

        const ix: Parameters<Transaction["add"]>[0][] = [];
        const toAccountInfo = await connection.getAccountInfo(toAta);
        if (!toAccountInfo) {
          ix.push(createAssociatedTokenAccountInstruction(fromPubkey, toAta, toPubkey, USDC_MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
        }
        ix.push(createTransferInstruction(fromAta, toAta, fromPubkey, atomicAmount, [], TOKEN_PROGRAM_ID));

        const tx = new Transaction().add(...ix);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = fromPubkey;

        setTxStep("Confirm in your wallet...");
        const signedTx = await walletProvider.signTransaction(tx);

        setTxStep("Sending transaction...");
        const signature = await connection.sendRawTransaction(signedTx.serialize());

        setTxStep("Confirming...");
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

        sendEnvelope({
          type: envelopeType === "gacha" ? "gift_gacha" : "gift_envelope",
          transactionHash: signature,
          amount: amount.toString(),
          content: message,
        });

        setTxStep("");
      } catch (e) {
        console.error("Envelope send error:", e);
        setTxStep("");
      } finally {
        setSending(false);
      }
    },
    [walletProvider, partnerWallet, envelopeType, sendEnvelope]
  );

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
            <img src={partnerProfile.image} alt={partnerName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm font-medium text-zinc-500">
              {partnerName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{partnerName}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono truncate">{truncateWallet(partnerWallet)}</p>
          </div>
          {!connected && <span className="ml-auto text-xs text-amber-500">Connecting...</span>}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 mx-auto w-full max-w-3xl">
        {messages.length === 0 && connected && (
          <div className="text-center py-16 space-y-2">
            <div className="text-3xl">👋</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Start a conversation</p>
          </div>
        )}

        <div className="space-y-2">
          {messages.map((msg, i) => {
            const prevCreatedAt = i > 0 ? messages[i - 1].created_at : null;
            const showDate = shouldShowDateSeparator(msg.created_at, prevCreatedAt);
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
                <MessageBubble msg={msg} isMine={isMine} myWallet={myWallet} />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Transaction step indicator */}
      {txStep && (
        <div className="mx-auto max-w-3xl px-4 pb-2">
          <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-800 px-4 py-3 text-sm text-violet-700 dark:text-violet-300 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {txStep}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="sticky bottom-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pb-20 md:pb-0 relative">
        <GiftPicker
          open={giftPickerOpen}
          onClose={() => setGiftPickerOpen(false)}
          onSelect={handleGiftSelect}
          devMode={devMode}
        />

        <div className="mx-auto max-w-3xl px-4 py-3 flex items-end gap-2">
          {/* Gift / attach button */}
          <button
            type="button"
            onClick={() => setGiftPickerOpen(!giftPickerOpen)}
            className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors ${
              giftPickerOpen
                ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            aria-label="Send a gift"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

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

      {/* Envelope composer modal */}
      <EnvelopeComposer
        open={envelopeComposerOpen}
        onClose={() => setEnvelopeComposerOpen(false)}
        onSend={handleEnvelopeSend}
        type={envelopeType}
      />

      {/* Favour picker modal */}
      <FavourPickerModal
        open={favourPickerOpen}
        onClose={() => setFavourPickerOpen(false)}
        onSelect={(favourId) => {
          sendFavourShare(favourId);
          setFavourPickerOpen(false);
        }}
      />

      {/* Gold tier picker modal */}
      <GoldTierPicker
        open={goldPickerOpen}
        onClose={() => setGoldPickerOpen(false)}
        onSelect={(amount) => {
          // TODO: implement on-chain GOLD SPL transfer flow similar to envelope
          setGoldPickerOpen(false);
        }}
      />
    </div>
  );
}
