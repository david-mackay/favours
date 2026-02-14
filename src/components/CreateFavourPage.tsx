"use client";

import { Navbar } from "@/components/Navbar";
import { CreateFavourForm } from "@/components/CreateFavourForm";

export function CreateFavourPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Post a Favour
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ask for help—and add a little thank-you. Give friends an excuse to
            visit!
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <CreateFavourForm />
        </div>
      </main>
    </div>
  );
}
