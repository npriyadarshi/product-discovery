"use client";

import { SearchIcon } from "./icons";

export function EmptyState({
  query,
  didYouMean,
  onApplySuggestion,
  onReset,
  hasActiveFilters,
}: {
  query: string;
  didYouMean: string | null;
  onApplySuggestion: (term: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-clay-soft text-clay-ink">
        <SearchIcon className="h-6 w-6" />
      </span>

      <h2 className="mt-5 font-display text-2xl text-ink">No matches found</h2>

      <p className="mt-2 max-w-md text-sm text-muted">
        {query ? (
          <>
            We couldn&apos;t find anything for{" "}
            <span className="font-medium text-ink">“{query}”</span>
            {hasActiveFilters ? " with your current filters." : "."}
          </>
        ) : (
          "No products match your current filters."
        )}
      </p>

      {didYouMean && (
        <p className="mt-4 text-sm text-muted">
          Did you mean{" "}
          <button
            type="button"
            onClick={() => onApplySuggestion(didYouMean)}
            className="font-medium text-clay-ink underline underline-offset-2"
          >
            {didYouMean}
          </button>
          ?
        </p>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90"
      >
        Reset search &amp; filters
      </button>
    </div>
  );
}
