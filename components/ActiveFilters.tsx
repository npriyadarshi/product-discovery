"use client";

import type { Filters } from "@/hooks/useProductSearch";
import { CloseIcon } from "./icons";

type FacetKey = "categories" | "brands" | "materials";

interface Chip {
  label: string;
  onRemove: () => void;
}

export function ActiveFilters({
  filters,
  setFilters,
  toggleFacet,
  clearFilters,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  toggleFacet: (key: FacetKey, value: string) => void;
  clearFilters: () => void;
}) {
  const chips: Chip[] = [];

  (["categories", "brands", "materials", "tags"] as FacetKey[]).forEach((key) => {
    filters[key].forEach((value) =>
      chips.push({ label: value, onRemove: () => toggleFacet(key, value) }),
    );
  });

  if (filters.inStockOnly) {
    chips.push({ label: "In stock", onRemove: () => setFilters({ ...filters, inStockOnly: false }) });
  }
  if (filters.priceOnRequestOnly) {
    chips.push({
      label: "Price on request",
      onRemove: () => setFilters({ ...filters, priceOnRequestOnly: false }),
    });
  }
  if (filters.minRating > 0) {
    chips.push({
      label: `${filters.minRating.toFixed(1)}+ rating`,
      onRemove: () => setFilters({ ...filters, minRating: 0 }),
    });
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    const lo = filters.priceMin != null ? `$${filters.priceMin}` : "$0";
    const hi = filters.priceMax != null ? `$${filters.priceMax}` : "any";
    chips.push({
      label: `${lo}–${hi}`,
      onRemove: () => setFilters({ ...filters, priceMin: null, priceMax: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, i) => (
        <button
          key={`${chip.label}-${i}`}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink transition hover:border-clay/50"
        >
          {chip.label}
          <CloseIcon className="h-3 w-3 text-muted" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearFilters}
        className="text-xs font-medium text-clay-ink underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
