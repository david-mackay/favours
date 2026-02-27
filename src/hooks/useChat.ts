"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const CHAT_SERVER_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:3001";

export type MessageType =
  | "text"
  | "gift_token"
  | "gift_nft"
  | "favour_share"
  | "gift_envelope"
  | "gift_gacha";

export interface ChatMessage {
  id: string;
  sender_wallet: string;
  receiver_wallet: string;
  content: string | null;
  type: MessageType;
  media_url: string | null;
  amount: string | null;
  transaction_hash: string | null;
  mint_address: string | null;
  token_symbol: string | null;
  token_name: string | null;
  nft_name: string | null;
  favour_id: string | null;
  is_opened: boolean;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  partnerWallet: string;
  lastMessage: string | null;
  lastMessageType: string;
  lastMessageAt: string;
  lastSenderWallet: string;
  unreadCount: number;
}

export interface TapestryProfile {
  username: string | null;
  image: string | null;
}

async function fetchChatToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/chat/token", { method: "POST" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

export async function fetchTapestryProfile(
  wallet: string,
): Promise<TapestryProfile> {
  try {
    const res = await fetch(
      `/api/tapestry/profile?wallet=${encodeURIComponent(wallet)}`,
    );
    if (!res.ok) return { username: null, image: null };
    return (await res.json()) as TapestryProfile;
  } catch {
    return { username: null, image: null };
  }
}

export async function fetchTapestryProfiles(
  wallets: string[],
): Promise<Record<string, TapestryProfile>> {
  const unique = [...new Set(wallets)];
  const entries = await Promise.all(
    unique.map(async (w) => [w, await fetchTapestryProfile(w)] as const),
  );
  return Object.fromEntries(entries);
}

export function useChat(otherWallet: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const sessionTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const chatToken = await fetchChatToken();
      if (!chatToken || cancelled) return;

      const socket = io(CHAT_SERVER_URL, {
        query: { token: chatToken },
        transports: ["websocket", "polling"],
      });

      socket.on("auth_success", ({ session_token }: { session_token: string }) => {
        sessionTokenRef.current = session_token;
        setConnected(true);

        socket.emit("join_conversation", {
          session_token,
          otherWallet,
        });
      });

      socket.on("message_history", (data: { conversationId: string; messages: ChatMessage[] }) => {
        setConversationId(data.conversationId);
        setMessages(data.messages);

        if (sessionTokenRef.current) {
          socket.emit("mark_read", {
            session_token: sessionTokenRef.current,
            otherWallet,
          });
        }
      });

      socket.on("new_message", (data: { conversationId: string; message: ChatMessage }) => {
        setMessages((prev) => [...prev, data.message]);

        if (sessionTokenRef.current) {
          socket.emit("mark_read", {
            session_token: sessionTokenRef.current,
            otherWallet,
          });
        }
      });

      socket.on("disconnect", () => {
        setConnected(false);
      });

      socketRef.current = socket;
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      sessionTokenRef.current = null;
      setConnected(false);
      setMessages([]);
    };
  }, [otherWallet]);

  const sendMessage = useCallback((content: string) => {
    const token = sessionTokenRef.current;
    if (!token || !socketRef.current) return;

    socketRef.current.emit("send_message", {
      session_token: token,
      recipientWallet: otherWallet,
      content,
    });
  }, [otherWallet]);

  const sendGift = useCallback(
    (gift: {
      type: "gift_token" | "gift_nft";
      transactionHash: string;
      mintAddress: string;
      amount?: string;
      tokenSymbol?: string;
      tokenName?: string;
      nftName?: string;
      imageUrl?: string;
      content?: string;
    }) => {
      const token = sessionTokenRef.current;
      if (!token || !socketRef.current) return;

      socketRef.current.emit("send_gift", {
        session_token: token,
        recipientWallet: otherWallet,
        ...gift,
      });
    },
    [otherWallet],
  );

  const sendFavourShare = useCallback(
    (favourId: string, content?: string) => {
      const token = sessionTokenRef.current;
      if (!token || !socketRef.current) return;

      socketRef.current.emit("send_favour_share", {
        session_token: token,
        recipientWallet: otherWallet,
        favourId,
        content,
      });
    },
    [otherWallet],
  );

  const sendEnvelope = useCallback(
    (envelope: {
      type: "gift_envelope" | "gift_gacha";
      transactionHash: string;
      amount: string;
      content?: string;
    }) => {
      const token = sessionTokenRef.current;
      if (!token || !socketRef.current) return;

      socketRef.current.emit("send_envelope", {
        session_token: token,
        recipientWallet: otherWallet,
        ...envelope,
      });
    },
    [otherWallet],
  );

  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
    );
  }, []);

  return {
    connected,
    messages,
    conversationId,
    sendMessage,
    sendGift,
    sendFavourShare,
    sendEnvelope,
    updateMessage,
  };
}

export async function fetchConversations(
  chatToken: string,
  walletAddress: string,
): Promise<Conversation[]> {
  const res = await fetch(
    `${CHAT_SERVER_URL}/conversations?wallet=${walletAddress}`,
    { headers: { Authorization: `Bearer ${chatToken}` } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations ?? [];
}

export { fetchChatToken };
