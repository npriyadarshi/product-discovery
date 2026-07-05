import type { SortKey } from "./types";

// Curated "try this" chips. Each is a real, high-frequency product *tag*, so a
// click toggles the same multi-select Tags facet (they stay in sync). A shopper
// can stack several and then narrow further by typing in the search box.
export const POPULAR_TERMS = [
  "lamp",
  "vase",
  "tray",
  "stool",
  "handwoven",
  "vintage",
  "stackable",
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
