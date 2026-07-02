"use client";

import { useState } from "react";
import type { CleanItem } from "@/lib/types";
import { categoryTint } from "@/lib/format";
import { ImageOffIcon } from "./icons";

interface Props {
  item: CleanItem;
  className?: string;
}

/**
 * Renders a product image, but never a broken one. ~350 records either have no
 * image or point at a dead host; both resolve to `item.image === null` and get a
 * calm, category-tinted placeholder. We also guard against runtime load failures
 * (a picsum hiccup) via onError.
 */
export function ProductImage({ item, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !item.image || failed;

  if (showPlaceholder) {
    const tint = categoryTint(item.category);
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 ${className}`}
        style={{ background: tint.bg, color: tint.fg }}
        aria-label={`${item.category} — image unavailable`}
      >
        <ImageOffIcon className="h-7 w-7 opacity-70" />
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-80">
          {item.category}
        </span>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={item.image ?? undefined}
      alt={item.title}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
