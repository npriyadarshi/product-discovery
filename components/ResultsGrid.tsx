"use client";

import type { CleanItem } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ResultsGrid({
  items,
  onSelect,
  canLoadMore,
  onLoadMore,
}: {
  items: CleanItem[];
  onSelect: (item: CleanItem) => void;
  canLoadMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-6 min-[400px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="h-full animate-fade-in">
            <ProductCard item={item} onSelect={onSelect} />
          </div>
        ))}
      </div>

      {canLoadMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            className="rounded-full border border-line bg-surface px-6 py-2.5 text-sm font-medium text-ink transition hover:border-clay/50 hover:bg-clay-soft/40"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
