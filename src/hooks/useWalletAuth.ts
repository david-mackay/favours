"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana";

function encodeSignature(signature: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < signature.length; i++) {
    binary += String.fromCharCode(signature[i]);
  }
  return btoa(binary);
}

type AuthStatus =
  | "checking"
  | "unauthenticated"
  | "authenticating"
  | "authenticated"
  | "error";

interface AuthUser {
  id: string;
  walletAddress: string;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error?: string | null;
}

const initialState: AuthState = {
  status: "checking",
  user: null,
  error: null,
};

export function useWalletAuth() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const [state, setState] = useState<AuthState>(initialState);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!res.ok) {
        setState({ status: "unauthenticated", user: null });
        return;
      }

      const data = (await res.json()) as {
        authenticated: boolean;
        user?: AuthUser;
      };

      if (data.authenticated && data.user) {
        setState({ status: "authenticated", user: data.user });
      } else {
        setState({ status: "unauthenticated", user: null });
      }
    } catch (error) {
      console.error("Failed to fetch auth session", error);
      setState({
        status: "error",
        user: null,
        error: "Failed to load session",
      });
    }
  }, []);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const authenticate = useCallback(async () => {
    if (!isConnected || !address || !walletProvider) {
      setState({ status: "unauthenticated", user: null });
      return;
    }

    try {
      setState((prev) => ({ ...prev, status: "authenticating", error: null }));

      // 1. Get nonce and message to sign
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!nonceRes.ok) {
        const err = await nonceRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get sign-in message");
      }

      const { nonce, message } = (await nonceRes.json()) as {
        nonce: string;
        message: string;
      };

      // 2. Sign the message with the wallet
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await walletProvider.signMessage(encodedMessage);

      if (!signature || signature.length === 0) {
        throw new Error("Signing was cancelled or failed");
      }

      const signatureBase64 = encodeSignature(
        signature instanceof Uint8Array ? signature : new Uint8Array(signature)
      );

      // 3. Create session with proof of ownership
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          walletAddress: address,
          signature: signatureBase64,
          nonce,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to create session");
      }

      const data = (await res.json()) as {
        ok: boolean;
        user: AuthUser;
      };

      if (!data.ok || !data.user) {
        throw new Error("Failed to create session");
      }

      setState({ status: "authenticated", user: data.user });
    } catch (error) {
      console.error("Authentication failed", error);
      setState({
        status: "error",
        user: null,
        error: error instanceof Error ? error.message : "Authentication failed",
      });
    }
  }, [address, isConnected, walletProvider]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      setState({ status: "unauthenticated", user: null });
    }
  }, []);

  useEffect(() => {
    if (!isConnected || !address) {
      setState((prev) =>
        prev.status === "checking"
          ? { status: "unauthenticated", user: null }
          : { ...prev, user: null }
      );
      return;
    }

    // Wait until initial session check completes
    if (state.status === "checking") return;

    // Need walletProvider to sign - wait for it before auto-authenticating
    if (!walletProvider) return;

    // If already authenticated with this wallet, no need to re-authenticate
    if (
      state.status === "authenticated" &&
      state.user?.walletAddress === address
    ) {
      return;
    }

    // If not authenticated but connected, create session (with SIWS)
    if (state.status === "unauthenticated") {
      void authenticate();
    }
  }, [
    isConnected,
    address,
    walletProvider,
    authenticate,
    state.status,
    state.user?.walletAddress,
  ]);

  return useMemo(
    () => ({
      status: state.status,
      user: state.user,
      error: state.error,
      isAuthenticated: state.status === "authenticated",
      authenticate,
      logout,
      refresh: fetchSession,
    }),
    [state, authenticate, logout, fetchSession]
  );
}

