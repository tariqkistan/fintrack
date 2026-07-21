"use client";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl void-glass void-glow-border sm:max-h-[85vh] sm:max-w-lg sm:rounded-xl",
          "pb-[env(safe-area-inset-bottom)]"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" />
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/5 px-4 py-3 sm:border-0 sm:px-6 sm:pb-0 sm:pt-6">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:pb-6">{children}</div>
      </div>
    </div>
  );
}
