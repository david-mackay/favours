"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

import { useWalletAuth } from "@/hooks/useWalletAuth";

export default function AuthPage() {
  const router = useRouter();
  const walletAuth = useWalletAuth();
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();

  useEffect(() => {
    if (walletAuth.status === "authenticated") {
      router.replace("/");
    }
  }, [walletAuth.status, router]);

  const isLoading =
    walletAuth.status === "checking" || walletAuth.status === "authenticating";

  const handleSignIn = () => {
    if (!isConnected) {
      open();
    } else if (walletAuth.status === "unauthenticated") {
      walletAuth.authenticate();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            favours<span className="text-violet-500">.xyz</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Help friends. Get helped. Stay connected.
            <br />A little thank-you makes it fun.
          </p>
        </div>

        {/* Sign in card */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 rounded-xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Get started
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Sign in to start helping friends and getting helped.
            </p>
          </div>

          {walletAuth.error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-200">
              {walletAuth.error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            className="w-full px-4 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Sign in"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <button
            onClick={() => open()}
            className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-colors"
          >
            Sign in with email
          </button>

          <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center">
            Phantom, Solflare, or email login supported.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl">🤝</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Post favours
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">🎁</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Set thank-yous
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">✨</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Get thanked
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
