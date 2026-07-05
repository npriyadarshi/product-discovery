import MiniSearch from "minisearch";
import type { CleanItem } from "./types";

/** Minimum fragment length before it participates in substring (infix) matching.
 *  1-char fragments are pure noise; the prefix pass already covers them. */
const MIN_INFIX_LEN = 2;

/** A single searchable document for the infix pass: its id and a flattened,
 *  lowercased blob of the fields we trust (deliberately NOT the description). */
interface CorpusDoc {
  id: number;
  text: string;
}

/**
 * The search engine bundles two complementary matchers:
 *
 *  - `mini`   — MiniSearch, giving weighted, typo-tolerant, prefix relevance.
 *  - `corpus` — a flat text blob per item for substring/infix matching.
 *
 * MiniSearch alone only matches from the *start* of a word (prefix) or within a
 * small edit distance (fuzzy). It cannot match the *middle or end* of a word, so
 * typing "eath" would never surface "leather". The corpus closes that gap while
 * MiniSearch keeps ranking the strong matches on top.
 */
export interface SearchEngine {
  mini: MiniSearch<CleanItem>;
  corpus: CorpusDoc[];
}

/** Split a query into lowercased word fragments (same idea as MiniSearch's own
 *  tokenizer: break on anything that isn't a letter or digit). */
function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

/**
 * Build the search engine.
 *
 * The single most important decision here is *what we index*. The data's
 * `description` field is noisy and frequently contradicts the record (a "Velvet
 * Lantern" whose description talks about a bamboo blanket), so indexing it would
 * pollute relevance. We index only the trustworthy signal — title, brand,
 * category, material and tags — and weight them by how much a shopper means them
 * when they type: the product's own name first, then what it's made of and how
 * it's tagged, then who makes it and where it lives in the catalog. The infix
 * corpus is built from the exact same fields, so both matchers stay in agreement.
 */
export function buildEngine(items: CleanItem[]): SearchEngine {
  const mini = new MiniSearch<CleanItem>({
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
  mini.addAll(items);

  const corpus: CorpusDoc[] = items.map((doc) => ({
    id: doc.id,
    text: [doc.title, doc.material ?? "", doc.brand, doc.category, ...(doc.tags ?? [])]
      .join(" ")
      .toLowerCase(),
  }));

  return { mini, corpus };
}

export interface Ranked {
  id: number;
  score: number;
}

/**
 * Run a query and return matching ids in relevance order.
 *
 * Two passes, unioned:
 *  1. MiniSearch — weighted prefix + fuzzy. These are the strongest matches and
 *     always rank first, preserving the "title beats tags beats brand" ordering.
 *  2. Infix fallback — every query fragment (>= 2 chars) must appear *somewhere*
 *     in the item's searchable text. This recovers mid/end-of-word fragments
 *     ("eath" -> leather) that MiniSearch structurally can't reach. Substring-
 *     only matches are appended after the ranked ones.
 */
export function searchRanked(engine: SearchEngine, query: string): Ranked[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Pass 1: weighted relevance.
  const primary: Ranked[] = engine.mini
    .search(trimmed)
    .map((r) => ({ id: r.id as number, score: r.score }));

  // Pass 2: substring/infix recall for anything the ranked pass didn't already
  // catch. Fragments shorter than MIN_INFIX_LEN are ignored to avoid noise.
  const infixTokens = tokenize(trimmed).filter((t) => t.length >= MIN_INFIX_LEN);
  if (infixTokens.length === 0) return primary;

  const seen = new Set(primary.map((r) => r.id));
  const infix: Ranked[] = [];
  for (const doc of engine.corpus) {
    if (seen.has(doc.id)) continue;
    if (infixTokens.every((t) => doc.text.includes(t))) {
      infix.push({ id: doc.id, score: 0 });
    }
  }

  return primary.concat(infix);
}

/**
 * "Did you mean" — when a query returns nothing, ask MiniSearch for the closest
 * indexed suggestion so we can offer a one-tap correction instead of a wall.
 */
export function didYouMean(engine: SearchEngine, query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const suggestions = engine.mini.autoSuggest(trimmed, { fuzzy: 0.3 });
  const best = suggestions[0]?.suggestion?.trim();
  if (!best || best.toLowerCase() === trimmed.toLowerCase()) return null;
  return best;
}

/** As-you-type completions for the search box. */
export function autoSuggest(
  engine: SearchEngine,
  query: string,
  limit = 6,
): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return engine.mini
    .autoSuggest(trimmed, { fuzzy: 0.2, prefix: true })
    .slice(0, limit)
    .map((s) => s.suggestion);
}
