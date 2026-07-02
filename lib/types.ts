// Shape of the raw catalog records exactly as they arrive in items.json.
// Note how loose the value types are — this is what makes the data "dirty":
// price can be a number, a comma-formatted string, or null; images may be
// missing or point at a dead host; ratings are null when there are no reviews.
export interface RawItem {
  id: number;
  title: string;
  brand: string;
  category: string;
  tags: string[];
  price: number | string | null;
  rating: number | null;
  reviews: number;
  inStock: boolean;
  releasedAt: string;
  image: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  description: string | null;
}

// Data-quality flags we surface subtly in the UI (the "data health" touch).
export interface ItemFlags {
  missingImage: boolean;
  missingPrice: boolean;
  messyTitle: boolean;
}

// The normalized record the rest of the app is allowed to use. Everything
// downstream (search, facets, cards) reads CleanItem, never RawItem.
export interface CleanItem {
  id: number;
  title: string; // trimmed + case-normalized for display
  brand: string;
  category: string;
  tags: string[];
  material: string | null; // derived from tags, powers the material facet
  price: number | null; // parsed to a real number; null === "Price on request"
  rating: number | null;
  reviews: number;
  inStock: boolean;
  releasedAt: string;
  releasedTimestamp: number; // Date.parse, for "newest" sorting
  image: string | null; // only ever a URL that can actually load, else null
  imageWidth: number | null;
  imageHeight: number | null;
  description: string | null;
  flags: ItemFlags;
}

export type SortKey =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest";
