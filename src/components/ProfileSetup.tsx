"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

interface ProfileSetupProps {
  /** When provided, form is in edit mode with pre-filled values */
  initialData?: {
    username?: string;
    bio?: string;
    image?: string | null;
  };
}

export function ProfileSetup({ initialData }: ProfileSetupProps = {}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState(initialData?.username ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image ?? null,
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setError("Use JPEG, PNG, WebP, or GIF");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/profile/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          throw new Error(data.error || "Image upload failed");
        }
        const { url } = await uploadRes.json();
        imageUrl = url;
      } else if (initialData?.image) {
        imageUrl = initialData.image;
      }

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          bio: bio.trim() || undefined,
          image: imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create profile");
      }

      router.push(initialData ? "/profile" : "/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = Boolean(initialData?.username);

  return (
    <div className="min-h-screen pb-24 md:pb-0 py-8 px-4 bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="w-full max-w-md mx-auto space-y-8 mt-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {isEdit ? (
              "Edit profile"
            ) : (
              <>
                Welcome to favours<span className="text-violet-500">.xyz</span>
              </>
            )}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isEdit
              ? "Update your username, bio, or profile photo."
              : "Set up your profile to start posting and claiming favours."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-5"
        >
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Profile photo <span className="text-zinc-400">(optional)</span>
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-800 hover:border-violet-500 transition-colors"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-zinc-400">+</span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="text-xs text-zinc-500">
                {imageFile ? imageFile.name : "JPEG, PNG, WebP, GIF. Max 2MB"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Username
            </label>
            <input
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="satoshi"
              maxLength={30}
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              required
            />
            <p className="text-xs text-zinc-500">
              Lowercase letters, numbers, and underscores only.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Bio <span className="text-zinc-400">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={3}
              maxLength={160}
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || username.length < 3}
            className="w-full py-3 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? initialData
                ? "Saving..."
                : "Creating profile..."
              : initialData
                ? "Save Profile"
                : "Create Profile"}
          </button>
        </form>
      </main>
    </div>
  );
}
