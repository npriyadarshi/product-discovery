"use client";

import type { CleanItem } from "@/lib/types";
import { formatPrice, formatRating } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { StarIcon } from "./icons";

interface Props {
  item: CleanItem;
  onSelect: (item: CleanItem) => void;
}

export function ProductCard({ item, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-18px_rgba(60,45,30,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/60"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-line/40">
        <ProductImage
          item={item}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />

        {/* subtle data-health dot, top-left */}
        {(item.flags.missingImage || item.flags.missingPrice) && (
          <span
            title={
              [
                item.flags.missingImage ? "No image in source data" : null,
                item.flags.missingPrice ? "Price on request" : null,
              ]
                .filter(Boolean)
                .join(" · ")
            }
            className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full bg-clay/80 ring-2 ring-surface"
          />
        )}

        {!item.inStock && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-paper">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            {item.brand}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <StarIcon className="h-3 w-3 text-clay" />
            {formatRating(item.rating)}
          </span>
        </div>

        <h3 className="font-display text-[15px] leading-snug text-ink">
          {item.title}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span
            className={`text-sm ${
              item.price == null ? "italic text-muted" : "font-medium text-ink"
            }`}
          >
            {formatPrice(item.price)}
          </span>
          {item.material && (
            <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted">
              {item.material}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
