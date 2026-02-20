"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

import { useWalletAuth } from "@/hooks/useWalletAuth";

const features = [
  {
    icon: "🤝",
    title: "Post a favour",
    description:
      "Need help moving, a ride to the airport, or someone to watch your dog? Post it.",
  },
  {
    icon: "🎁",
    title: "Set a thank-you",
    description:
      "Attach a token bounty, an NFT, or just a heartfelt message as your thank-you.",
  },
  {
    icon: "✨",
    title: "Earn your reward",
    description:
      "Help someone out, claim the favour, and receive your thank-you on-chain.",
  },
];

const howItWorks = [
  { step: "01", label: "Connect your wallet" },
  { step: "02", label: "Post or browse favours" },
  { step: "03", label: "Help out & get thanked" },
];

export default function AuthPage() {
  const router = useRouter();
  const walletAuth = useWalletAuth();
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();

  useEffect(() => {
    if (walletAuth.status !== "authenticated") return;

    const checkProfile = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const data = await res.json();
        if (data.needsSetup) {
          router.replace("/profile/setup");
        } else {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    };

    void checkProfile();
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black overflow-x-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-violet-400/20 dark:bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-12 space-y-24">
        {/* ── Hero ── */}
        <section className="text-center space-y-6 pt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-700/60 bg-violet-50 dark:bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            Live on Solana
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.05]">
            favours
            <span className="text-violet-500">.xyz</span>
          </h1>

          <p className="mx-auto max-w-xl text-xl sm:text-2xl text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
            A social layer for real-life help.
            <br className="hidden sm:block" />
            Post, help, and get thanked — on-chain.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold text-base transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Connecting…" : "Get started free"}
            </button>
            <button
              onClick={() => open()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-[0.98] text-zinc-700 dark:text-zinc-300 font-medium text-base transition-all"
            >
              Sign in with email
            </button>
          </div>

          {walletAuth.error && (
            <div className="mx-auto max-w-sm rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-200">
              {walletAuth.error}
            </div>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Phantom, Solflare, Backpack, and email login supported.
          </p>
        </section>

        {/* ── Features ── */}
        <section className="space-y-6">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-3 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-500/5 transition-all"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Steps ── */}
        <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-8 sm:p-12 text-white space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Three steps to your first favour
            </h2>
            <p className="text-violet-200 text-sm">
              No credit card. No fees to post. Just vibes.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black text-white/60">
                    {item.step}
                  </div>
                  {i < howItWorks.length - 1 && (
                    <div className="hidden sm:block absolute top-1/2 left-full w-full h-px bg-white/20" />
                  )}
                </div>
                <p className="font-medium text-sm text-violet-100">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="px-8 py-3 rounded-2xl bg-white hover:bg-violet-50 active:scale-[0.98] text-violet-700 font-semibold transition-all shadow-md disabled:opacity-50"
            >
              {isLoading ? "Connecting…" : "Start now →"}
            </button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="text-center text-xs text-zinc-400 dark:text-zinc-600 pb-4">
          favours.xyz · Built on Solana · Open to all
        </footer>
      </div>
    </div>
  );
}
