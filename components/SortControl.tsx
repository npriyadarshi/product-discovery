"use client";

import type { SortKey } from "@/lib/types";
import { SORT_OPTIONS } from "@/lib/constants";
import { ChevronDownIcon } from "./icons";

export function SortControl({
  value,
  onChange,
  disabledRelevance,
}: {
  value: SortKey;
  onChange: (s: SortKey) => void;
  disabledRelevance: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="appearance-none rounded-full border border-line bg-surface py-2 pl-4 pr-9 text-sm text-ink transition hover:border-clay/40 focus:border-clay/50 focus:outline-none"
        aria-label="Sort results"
      >
        {SORT_OPTIONS.map((opt) => (
          <option
            key={opt.key}
            value={opt.key}
            disabled={opt.key === "relevance" && disabledRelevance}
          >
            Sort: {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
