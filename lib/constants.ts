import type { SortKey } from "./types";

// Curated "try this" chips. These are common, high-yield queries a real shopper
// would reach for, and they show off prefix + material + category matching.
export const POPULAR_TERMS = [
  "rattan",
  "table lamp",
  "planter",
  "marble",
  "kitchen",
  "oak",
  "vase",
];

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
  { key: "newest", label: "Newest" },
];

// How many results to render at once. The full set stays searchable/filterable;
// we just window the DOM so 4,000 potential cards never hit the page at once.
export const PAGE_SIZE = 48;
