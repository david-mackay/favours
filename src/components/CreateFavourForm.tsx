"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TOKENS,
  TokenSelectorModal,
  TokenButton,
} from "@/components/TokenSelector";

export interface CreateFavourFormProps {
  onSuccess?: (favourId: string) => void;
}

const categories = [
  { value: "errand", label: "Errand", emoji: "🏃" },
  { value: "delivery", label: "Delivery", emoji: "📦" },
  { value: "tech", label: "Tech Help", emoji: "💻" },
  { value: "cleaning", label: "Cleaning", emoji: "🧹" },
  { value: "food", label: "Food", emoji: "🍕" },
  { value: "shopping", label: "Shopping", emoji: "🛒" },
  { value: "moving", label: "Moving", emoji: "🚚" },
  { value: "other", label: "Other", emoji: "✨" },
];

export function CreateFavourForm({ onSuccess }: CreateFavourFormProps = {}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bountyAmount, setBountyAmount] = useState("");
  const [bountyToken, setBountyToken] = useState("USDC");
  const [category, setCategory] = useState("errand");
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/favours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          bountyAmount: parseFloat(bountyAmount),
          bountyToken,
          category,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create favour");
      }

      const data = await res.json();
      if (onSuccess) {
        onSuccess(data.favour.id);
      } else {
        router.push(`/favour/${data.favour.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create favour");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          What do you need done?
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Pick up my dry cleaning on Main St"
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Details <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details about what needs to be done, location, time constraints..."
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Category
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                category === cat.value
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Thank-you */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Thank-you
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={bountyAmount}
              onChange={(e) => setBountyAmount(e.target.value)}
              placeholder="0.05"
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <TokenButton
            token={TOKENS.find((t) => t.symbol === bountyToken) ?? TOKENS[0]}
            onClick={() => setTokenModalOpen(true)}
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          A little thank-you for whoever helps out.
        </p>
      </div>

      <TokenSelectorModal
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        tokens={TOKENS}
        selectedSymbol={bountyToken}
        onSelect={setBountyToken}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !title.trim() || !bountyAmount}
        className="w-full py-3 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Posting..." : "Post Favour"}
      </button>
    </form>
  );
}
