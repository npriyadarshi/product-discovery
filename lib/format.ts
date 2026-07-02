const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format a normalized price, or a graceful fallback for missing ones. */
export function formatPrice(price: number | null): string {
  if (price == null) return "Price on request";
  return priceFormatter.format(price);
}

/** One decimal place, e.g. 4.0 — or an em dash when there are no reviews. */
export function formatRating(rating: number | null): string {
  return rating == null ? "—" : rating.toFixed(1);
}

export function formatReviews(reviews: number): string {
  if (reviews === 0) return "No reviews yet";
  if (reviews === 1) return "1 review";
  return `${reviews.toLocaleString("en-US")} reviews`;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
});

export function formatReleased(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "—";
  return dateFormatter.format(new Date(ts));
}

/** Deterministic warm tint per category, used for image-less placeholder tiles. */
export function categoryTint(category: string): { bg: string; fg: string } {
  const palette: Record<string, { bg: string; fg: string }> = {
    Bath: { bg: "#e8eef0", fg: "#54707a" },
    Decor: { bg: "#f2e9e1", fg: "#8a6a52" },
    Furniture: { bg: "#ece7df", fg: "#6f6656" },
    Kitchen: { bg: "#eef0e7", fg: "#69735a" },
    Lighting: { bg: "#f4eee1", fg: "#8a7d55" },
    Office: { bg: "#e9ebef", fg: "#5f677a" },
    Outdoor: { bg: "#e6eee6", fg: "#5b7059" },
    Storage: { bg: "#efe9e4", fg: "#7c6f63" },
    Textiles: { bg: "#f2e8ea", fg: "#8a6472" },
    "Wall Art": { bg: "#eceaf1", fg: "#6b6685" },
  };
  return palette[category] ?? { bg: "#efe9e2", fg: "#7c7266" };
}
