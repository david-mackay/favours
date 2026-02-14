"use client";

import { useRouter } from "next/navigation";
import { CreateFavourForm } from "@/components/CreateFavourForm";

interface CreateFavourModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateFavourModal({ open, onClose }: CreateFavourModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handleSuccess = (favourId: string) => {
    onClose();
    router.push(`/favour/${favourId}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex flex-col h-full w-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl sm:border sm:border-zinc-200 dark:sm:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Post a Favour
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Ask for help—and add a little thank-you. Give friends an excuse to
            visit!
          </p>
          <CreateFavourForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
