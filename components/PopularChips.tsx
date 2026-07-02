"use client";

import { POPULAR_TERMS } from "@/lib/constants";

export function PopularChips({
  onPick,
  active,
}: {
  onPick: (term: string) => void;
  active: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        Popular
      </span>
      {POPULAR_TERMS.map((term) => {
        const isActive = active.trim().toLowerCase() === term.toLowerCase();
        return (
          <button
            key={term}
            type="button"
            onClick={() => onPick(term)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              isActive
                ? "border-clay bg-clay text-paper"
                : "border-line bg-surface text-muted hover:border-clay/50 hover:text-ink"
            }`}
          >
            {term}
          </button>
        );
      })}
    </div>
  );
}
