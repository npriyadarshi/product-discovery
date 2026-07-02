"use client";

import { useState } from "react";
import type { CleanItem } from "@/lib/types";
import { useProductSearch } from "@/hooks/useProductSearch";
import { SearchBar } from "@/components/SearchBar";
import { PopularChips } from "@/components/PopularChips";
import { FacetPanel } from "@/components/FacetPanel";
import { SortControl } from "@/components/SortControl";
import { ActiveFilters } from "@/components/ActiveFilters";
import { ResultsGrid } from "@/components/ResultsGrid";
import { EmptyState } from "@/components/EmptyState";
import { ProductDetail } from "@/components/ProductDetail";
import { SlidersIcon, CloseIcon } from "@/components/icons";

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="aspect-[4/5] w-full animate-pulse bg-line/50" />
      <div className="space-y-2 p-4">
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-line/60" />
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-line/60" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-line/60" />
      </div>
    </div>
  );
}

export default function Home() {
  const search = useProductSearch();
  const [selected, setSelected] = useState<CleanItem | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hasQuery = search.query.trim().length > 0;

  const facetPanel = (
    <FacetPanel
      filters={search.filters}
      categoryFacets={search.categoryFacets}
      brandFacets={search.brandFacets}
      materialFacets={search.materialFacets}
      priceBounds={search.priceBounds}
      toggleFacet={search.toggleFacet}
      setFilters={search.setFilters}
      clearFilters={search.clearFilters}
      activeFilterCount={search.activeFilterCount}
    />
  );

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-xl tracking-tight text-ink">Maison</span>
            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-muted sm:inline">
              Home Goods
            </span>
          </div>
          <span className="text-xs text-muted">
            {search.totalCount.toLocaleString("en-US")} products
          </span>
        </div>
      </header>

      {/* Hero + search */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:px-8 sm:py-16">
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-[2.6rem]">
            Find the piece that fits the room
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted sm:text-base">
            Instant, typo-tolerant search across a living catalog of home goods —
            with honest handling of its rough edges.
          </p>

          <div className="mt-7">
            <SearchBar
              value={search.query}
              onChange={search.setQuery}
              getSuggestions={search.getSuggestions}
              isSearching={search.isSearching}
            />
          </div>

          <div className="mt-5 flex justify-center">
            <PopularChips onPick={search.setQuery} active={search.query} />
          </div>
        </div>
      </section>

      {/* Body */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">
        {search.status === "error" ? (
          <div className="rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-20 text-center">
            <h2 className="font-display text-2xl text-ink">Couldn&apos;t load the catalog</h2>
            <p className="mt-2 text-sm text-muted">{search.error}</p>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Filter rail (desktop) */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-line bg-surface/70 p-5">
                {facetPanel}
              </div>
            </aside>

            {/* Results column */}
            <div className="min-w-0 flex-1">
              {/* Results toolbar */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted">
                  {search.status === "loading" ? (
                    "Loading catalog…"
                  ) : (
                    <>
                      <span className="font-medium text-ink">
                        {search.resultCount.toLocaleString("en-US")}
                      </span>{" "}
                      {search.resultCount === 1 ? "result" : "results"}
                      {hasQuery && (
                        <>
                          {" "}
                          for{" "}
                          <span className="font-medium text-ink">“{search.query}”</span>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:border-clay/40 lg:hidden"
                  >
                    <SlidersIcon className="h-4 w-4" />
                    Filters
                    {search.activeFilterCount > 0 && (
                      <span className="rounded-full bg-clay px-1.5 text-[11px] text-paper">
                        {search.activeFilterCount}
                      </span>
                    )}
                  </button>
                  <SortControl
                    value={search.sort}
                    onChange={search.setSort}
                    disabledRelevance={!hasQuery}
                  />
                </div>
              </div>

              {search.activeFilterCount > 0 && (
                <div className="mb-5">
                  <ActiveFilters
                    filters={search.filters}
                    setFilters={search.setFilters}
                    toggleFacet={search.toggleFacet}
                    clearFilters={search.clearFilters}
                  />
                </div>
              )}

              {/* Grid / states */}
              {search.status === "loading" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : search.resultCount === 0 ? (
                <EmptyState
                  query={search.query}
                  didYouMean={search.didYouMean}
                  hasActiveFilters={search.activeFilterCount > 0}
                  onApplySuggestion={search.setQuery}
                  onReset={() => {
                    search.setQuery("");
                    search.clearFilters();
                  }}
                />
              ) : (
                <ResultsGrid
                  items={search.visible}
                  onSelect={setSelected}
                  canLoadMore={search.canLoadMore}
                  onLoadMore={search.loadMore}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-7xl px-5 py-8 text-xs text-muted sm:px-8">
          Built as a product-discovery exercise · client-side search over ~4,000
          items with MiniSearch.
        </div>
      </footer>

      {/* Mobile filter drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          mobileFiltersOpen ? "" : "pointer-events-none"
        }`}
      >
        <div
          onClick={() => setMobileFiltersOpen(false)}
          className={`absolute inset-0 bg-ink/40 transition-opacity ${
            mobileFiltersOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-paper shadow-2xl transition-transform duration-300 ${
            mobileFiltersOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-display text-lg">Filters</span>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Close filters"
              className="rounded-full p-1.5 text-muted hover:bg-line/60 hover:text-ink"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{facetPanel}</div>
          <div className="border-t border-line p-4">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper"
            >
              Show {search.resultCount.toLocaleString("en-US")} results
            </button>
          </div>
        </aside>
      </div>

      <ProductDetail item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
