"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CleanItem, RawItem, SortKey } from "@/lib/types";
import { normalizeAll } from "@/lib/normalize";
import {
  autoSuggest,
  buildEngine,
  didYouMean as computeDidYouMean,
  searchRanked,
  type SearchEngine,
} from "@/lib/search";
import { asset } from "@/lib/basePath";
import { PAGE_SIZE } from "@/lib/constants";

export interface Filters {
  categories: string[];
  brands: string[];
  materials: string[];
  tags: string[];
  inStockOnly: boolean;
  priceOnRequestOnly: boolean;
  minRating: number;
  priceMin: number | null;
  priceMax: number | null;
}

export const EMPTY_FILTERS: Filters = {
  categories: [],
  brands: [],
  materials: [],
  tags: [],
  inStockOnly: false,
  priceOnRequestOnly: false,
  minRating: 0,
  priceMin: null,
  priceMax: null,
};

export interface FacetOption {
  value: string;
  count: number;
}

type FacetKey = "categories" | "brands" | "materials" | "tags";

interface Catalog {
  items: CleanItem[];
  engine: SearchEngine;
  byId: Map<number, CleanItem>;
  categories: string[];
  brands: string[];
  materials: string[];
  tags: string[];
  priceBounds: { min: number; max: number };
}

/** Debounce a rapidly-changing value (the search box) for the query pipeline. */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Predicate for a single item against the active filters, optionally ignoring
 *  one facet dimension so we can compute "sibling" counts within that facet. */
function matches(item: CleanItem, f: Filters, ignore?: FacetKey): boolean {
  if (ignore !== "categories" && f.categories.length && !f.categories.includes(item.category)) {
    return false;
  }
  if (ignore !== "brands" && f.brands.length && !f.brands.includes(item.brand)) {
    return false;
  }
  if (
    ignore !== "materials" &&
    f.materials.length &&
    (!item.material || !f.materials.includes(item.material))
  ) {
    return false;
  }
  if (
    ignore !== "tags" &&
    f.tags.length &&
    !f.tags.some((t) => item.tags.includes(t))
  ) {
    return false;
  }
  if (f.inStockOnly && !item.inStock) return false;
  if (f.minRating > 0 && (item.rating ?? 0) < f.minRating) return false;
  // "Price on request" is mutually exclusive with the price range: when it's on
  // we show *only* items with no listed price and ignore the min/max entirely.
  if (f.priceOnRequestOnly) {
    if (item.price != null) return false;
  } else {
    if (f.priceMin != null && (item.price == null || item.price < f.priceMin)) return false;
    if (f.priceMax != null && (item.price == null || item.price > f.priceMax)) return false;
  }
  return true;
}

function comparePriceAsc(a: CleanItem, b: CleanItem): number {
  if (a.price == null && b.price == null) return 0;
  if (a.price == null) return 1; // null prices always sink to the bottom
  if (b.price == null) return -1;
  return a.price - b.price;
}

function sortItems(items: CleanItem[], sort: SortKey, rankOf: Map<number, number> | null): CleanItem[] {
  const out = [...items];
  switch (sort) {
    case "price-asc":
      out.sort(comparePriceAsc);
      break;
    case "price-desc":
      out.sort((a, b) => -comparePriceAsc(a, b));
      break;
    case "rating":
      out.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.reviews - a.reviews);
      break;
    case "newest":
      out.sort((a, b) => b.releasedTimestamp - a.releasedTimestamp);
      break;
    case "relevance":
    default:
      if (rankOf) {
        out.sort((a, b) => (rankOf.get(a.id) ?? 0) - (rankOf.get(b.id) ?? 0));
      } else {
        // No query: a sensible "featured" default — in stock, then best rated,
        // then most reviewed.
        out.sort(
          (a, b) =>
            Number(b.inStock) - Number(a.inStock) ||
            (b.rating ?? 0) - (a.rating ?? 0) ||
            b.reviews - a.reviews,
        );
      }
  }
  return out;
}

export interface ProductSearch {
  status: "loading" | "ready" | "error";
  error: string | null;

  query: string;
  setQuery: (q: string) => void;
  isSearching: boolean;

  filters: Filters;
  setFilters: (f: Filters) => void;
  toggleFacet: (key: FacetKey, value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;

  sort: SortKey;
  setSort: (s: SortKey) => void;

  results: CleanItem[]; // full filtered + sorted set
  visible: CleanItem[]; // windowed slice actually rendered
  canLoadMore: boolean;
  loadMore: () => void;

  totalCount: number;
  resultCount: number;
  didYouMean: string | null;

  categoryFacets: FacetOption[];
  brandFacets: FacetOption[];
  materialFacets: FacetOption[];
  tagFacets: FacetOption[];
  priceBounds: { min: number; max: number };

  getSuggestions: (text: string) => string[];
}

export function useProductSearch(): ProductSearch {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const [query, setQueryRaw] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebouncedValue(query, 140);
  const isSearching = query !== debouncedQuery;

  // Load + normalize + index the catalog once, on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(asset("/items.json"));
        if (!res.ok) throw new Error(`Failed to load catalog (${res.status})`);
        const raw = (await res.json()) as RawItem[];
        const items = normalizeAll(raw);
        const engine = buildEngine(items);
        const byId = new Map(items.map((it) => [it.id, it]));
        const categories = [...new Set(items.map((it) => it.category))].sort();
        const brands = [...new Set(items.map((it) => it.brand))].sort();
        const materials = [
          ...new Set(items.map((it) => it.material).filter((m): m is string => !!m)),
        ].sort();
        // Tags are frequency-ranked so the facet leads with the most useful ones.
        const tagCounts = new Map<string, number>();
        for (const it of items) for (const t of it.tags) {
          tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
        }
        const tags = [...tagCounts.keys()].sort(
          (a, b) => (tagCounts.get(b)! - tagCounts.get(a)!) || a.localeCompare(b),
        );
        const priced = items.map((it) => it.price).filter((p): p is number => p != null);
        const priceBounds = {
          min: Math.floor(Math.min(...priced)),
          max: Math.ceil(Math.max(...priced)),
        };
        if (cancelled) return;
        setCatalog({ items, engine, byId, categories, brands, materials, tags, priceBounds });
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset the render window whenever the result set could change.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filters, sort]);

  // Query stage: which items match the text, and in what relevance order.
  const queried = useMemo(() => {
    if (!catalog) return { base: [] as CleanItem[], rankOf: null as Map<number, number> | null };
    const q = debouncedQuery.trim();
    if (!q) return { base: catalog.items, rankOf: null };
    const ranked = searchRanked(catalog.engine, q);
    const rankOf = new Map<number, number>();
    const base: CleanItem[] = [];
    ranked.forEach((r, i) => {
      const item = catalog.byId.get(r.id);
      if (item) {
        rankOf.set(r.id, i);
        base.push(item);
      }
    });
    return { base, rankOf };
  }, [catalog, debouncedQuery]);

  // Filter stage.
  const filtered = useMemo(
    () => queried.base.filter((it) => matches(it, filters)),
    [queried, filters],
  );

  // Sort stage.
  const results = useMemo(
    () => sortItems(filtered, sort, queried.rankOf),
    [filtered, sort, queried.rankOf],
  );

  // Facet counts reflect what you'd get if you toggled each value, honoring the
  // *other* active filters — so multi-select within a facet still shows siblings.
  const buildFacets = (key: FacetKey, options: string[]): FacetOption[] => {
    const pool = queried.base.filter((it) => matches(it, filters, key));
    const counts = new Map<string, number>();
    for (const it of pool) {
      if (key === "tags") {
        // Tags are multi-valued: every tag on the item contributes a count.
        for (const t of it.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
        continue;
      }
      const value = key === "categories" ? it.category : key === "brands" ? it.brand : it.material;
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return options.map((value) => ({ value, count: counts.get(value) ?? 0 }));
  };

  const categoryFacets = useMemo(
    () => (catalog ? buildFacets("categories", catalog.categories) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, queried, filters],
  );
  const brandFacets = useMemo(
    () => (catalog ? buildFacets("brands", catalog.brands) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, queried, filters],
  );
  const materialFacets = useMemo(
    () => (catalog ? buildFacets("materials", catalog.materials) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, queried, filters],
  );
  const tagFacets = useMemo(
    () => (catalog ? buildFacets("tags", catalog.tags) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, queried, filters],
  );

  const didYouMean = useMemo(() => {
    if (!catalog) return null;
    const q = debouncedQuery.trim();
    // Only offer a correction when the *query itself* found nothing (not when
    // filters emptied the set).
    if (!q || queried.base.length > 0) return null;
    return computeDidYouMean(catalog.engine, q);
  }, [catalog, debouncedQuery, queried.base.length]);

  const visible = results.slice(0, page * PAGE_SIZE);

  const activeFilterCount =
    filters.categories.length +
    filters.brands.length +
    filters.materials.length +
    filters.tags.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.priceOnRequestOnly ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0);

  const setQuery = (q: string) => setQueryRaw(q);

  const toggleFacet = (key: FacetKey, value: string) => {
    setFilters((prev) => {
      const set = new Set(prev[key]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [key]: [...set] };
    });
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const getSuggestions = (text: string) =>
    catalog ? autoSuggest(catalog.engine, text) : [];

  return {
    status,
    error,
    query,
    setQuery,
    isSearching,
    filters,
    setFilters,
    toggleFacet,
    clearFilters,
    activeFilterCount,
    sort,
    setSort,
    results,
    visible,
    canLoadMore: visible.length < results.length,
    loadMore: () => setPage((p) => p + 1),
    totalCount: catalog?.items.length ?? 0,
    resultCount: results.length,
    didYouMean,
    categoryFacets,
    brandFacets,
    materialFacets,
    tagFacets,
    priceBounds: catalog?.priceBounds ?? { min: 0, max: 0 },
    getSuggestions,
  };
}
