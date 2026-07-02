import MiniSearch from "minisearch";
import type { CleanItem } from "./types";

/**
 * Search index configuration.
 *
 * The single most important decision here is *what we index*. The data's
 * `description` field is noisy and frequently contradicts the record (a "Velvet
 * Lantern" whose description talks about a bamboo blanket), so indexing it would
 * pollute relevance. We index only the trustworthy signal — title, brand,
 * category, material and tags — and weight them by how much a shopper means them
 * when they type: the product's own name first, then what it's made of and how
 * it's tagged, then who makes it and where it lives in the catalog.
 */
export function buildIndex(items: CleanItem[]): MiniSearch<CleanItem> {
  const index = new MiniSearch<CleanItem>({
    idField: "id",
    fields: ["title", "material", "tags", "brand", "category"],
    // We hydrate full records from our own map, so nothing needs to be stored
    // inside the index itself.
    extractField: (doc, field) => {
      if (field === "tags") return (doc.tags ?? []).join(" ");
      const value = doc[field as keyof CleanItem];
      return value == null ? "" : String(value);
    },
    searchOptions: {
      boost: { title: 4, material: 2, tags: 2, brand: 1.5, category: 1.5 },
      fuzzy: 0.2, // tolerate typos like "rattann" or "terracota"
      prefix: true, // match as you type: "plan" -> "planter"
      combineWith: "AND", // every word should matter; narrows as you type
    },
  });
  index.addAll(items);
  return index;
}

export interface Ranked {
  id: number;
  score: number;
}

/** Run a query and return matching ids in relevance order. */
export function searchRanked(
  index: MiniSearch<CleanItem>,
  query: string,
): Ranked[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return index
    .search(trimmed)
    .map((r) => ({ id: r.id as number, score: r.score }));
}

/**
 * "Did you mean" — when a query returns nothing, ask MiniSearch for the closest
 * indexed suggestion so we can offer a one-tap correction instead of a wall.
 */
export function didYouMean(
  index: MiniSearch<CleanItem>,
  query: string,
): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const suggestions = index.autoSuggest(trimmed, { fuzzy: 0.3 });
  const best = suggestions[0]?.suggestion?.trim();
  if (!best || best.toLowerCase() === trimmed.toLowerCase()) return null;
  return best;
}

/** As-you-type completions for the search box. */
export function autoSuggest(
  index: MiniSearch<CleanItem>,
  query: string,
  limit = 6,
): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return index
    .autoSuggest(trimmed, { fuzzy: 0.2, prefix: true })
    .slice(0, limit)
    .map((s) => s.suggestion);
}
