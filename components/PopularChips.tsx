"use client";

import { POPULAR_TERMS } from "@/lib/constants";

export function PopularChips({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        Popular
      </span>
      {POPULAR_TERMS.map((term) => {
        const isActive = selected.includes(term);
        return (
          <button
            key={term}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(term)}
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
