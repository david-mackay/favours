"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { reownAppKit } from "@/context/appkit";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreateFavourModal } from "@/components/CreateFavourModal";

const navLinks = [
  { href: "/", label: "Feed", icon: FeedIcon },
  { href: "/messages", label: "Messages", icon: MessagesIcon },
  { href: "/friends", label: "Friends", icon: FriendsIcon },
  { href: "/swap", label: "Swap", icon: SwapIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
] as const;

function MessagesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function FeedIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
      />
    </svg>
  );
}

function FriendsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { address } = useAppKitAccount();
  const walletAuth = useWalletAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleLogout = async () => {
    await walletAuth.logout();
    await reownAppKit.disconnect("solana").catch(() => {});
    router.replace("/auth");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const activeLinkClass =
    "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-medium";
  const inactiveLinkClass =
    "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <>
      {/* Top bar - always visible */}
      <nav className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between h-14">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            favours<span className="text-violet-500">.xyz</span>
          </Link>

          {/* Desktop: full nav + profile */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                  isActive(link.href) ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="px-3 py-1.5 text-sm rounded-md bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors flex items-center gap-1.5"
            >
              <PlusIcon className="w-4 h-4" />
              New Favour
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {address && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom nav - mobile only, locked in place */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pb-[env(safe-area-inset-bottom)]"
        style={{ transform: "translateZ(0)" }}
      >
        <div className="mx-auto max-w-3xl flex items-center justify-around h-16 px-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-colors touch-manipulation min-w-0 ${
                isActive(link.href) ? activeLinkClass : inactiveLinkClass
              }`}
            >
              <link.icon className="w-6 h-6 shrink-0" />
              <span className="text-xs truncate w-full text-center">
                {link.label}
              </span>
            </Link>
          ))}
          {/* Big plus button - Create */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 -mt-4 touch-manipulation min-w-0 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-lg shadow-violet-500/25 transition-transform active:scale-95">
              <PlusIcon className="w-8 h-8" />
            </div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Create
            </span>
          </button>
        </div>
      </div>

      <CreateFavourModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
