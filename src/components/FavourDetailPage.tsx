"use client";

import { Navbar } from "@/components/Navbar";
import { FavourDetail } from "@/components/FavourDetail";
import Link from "next/link";

interface FavourDetailPageProps {
  favourId: string;
}

export function FavourDetailPage({ favourId }: FavourDetailPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-6 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          ← Back to feed
        </Link>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <FavourDetail favourId={favourId} />
        </div>
      </main>
    </div>
  );
}
