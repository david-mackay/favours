"use client";

import { Navbar } from "@/components/Navbar";
import { Swap } from "@/components/Swap";

export function SwapPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-8">
        <Swap />
      </main>
    </div>
  );
}
