"use client";

import { useEffect } from "react";
import type { CleanItem } from "@/lib/types";
import {
  formatPrice,
  formatRating,
  formatReviews,
  formatReleased,
} from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { DataHealthBadges } from "./DataHealthBadge";
import { CloseIcon, StarIcon } from "./icons";

export function ProductDetail({
  item,
  onClose,
}: {
  item: CleanItem | null;
  onClose: () => void;
}) {
  const open = item !== null;

  // Lock scroll + wire Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={item?.title ?? "Product detail"}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-300 ease-out sm:max-w-lg ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {item && (
          <>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {item.category}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted transition hover:bg-line/60 hover:text-ink"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="aspect-[4/3] w-full overflow-hidden bg-line/40">
                <ProductImage item={item} className="h-full w-full object-cover" />
              </div>

              <div className="space-y-6 px-6 py-6">
                <header className="space-y-2">
                  <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-clay-ink">
                    {item.brand}
                  </p>
                  <h2 className="font-display text-2xl leading-tight text-ink">
                    {item.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <StarIcon className="h-4 w-4 text-clay" />
                      <span className="text-ink">{formatRating(item.rating)}</span>
                      <span>· {formatReviews(item.reviews)}</span>
                    </span>
                    <span
                      className={
                        item.inStock ? "text-sage" : "text-clay-ink"
                      }
                    >
                      {item.inStock ? "In stock" : "Sold out"}
                    </span>
                  </div>
                </header>

                <div className="flex items-end justify-between border-y border-line py-4">
                  <span
                    className={`text-2xl ${
                      item.price == null ? "italic text-muted" : "font-semibold text-ink"
                    }`}
                  >
                    {formatPrice(item.price)}
                  </span>
                  <DataHealthBadges flags={item.flags} size="md" />
                </div>

                {item.description && (
                  <div className="space-y-1.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                      From the catalog
                    </h3>
                    <p className="text-sm leading-relaxed text-ink/80">
                      {item.description}
                    </p>
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Material</dt>
                    <dd className="text-ink">{item.material ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">Released</dt>
                    <dd className="text-ink">{formatReleased(item.releasedAt)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-muted">Tags</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {item.tags.length ? (
                        item.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs text-muted"
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink">—</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
