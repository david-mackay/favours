"use client";

import { Navbar } from "@/components/Navbar";
import { FavourFeed } from "@/components/FavourFeed";

export function FeedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Favours Board
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Help friends out—and give them reasons to visit.
          </p>
        </div>

        <FavourFeed />
      </main>
    </div>
  );
}
