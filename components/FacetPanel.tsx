"use client";

import type { FacetOption, Filters } from "@/hooks/useProductSearch";

type FacetKey = "categories" | "brands" | "materials";

interface Props {
  filters: Filters;
  categoryFacets: FacetOption[];
  brandFacets: FacetOption[];
  materialFacets: FacetOption[];
  priceBounds: { min: number; max: number };
  toggleFacet: (key: FacetKey, value: string) => void;
  setFilters: (f: Filters) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}

const RATING_STEPS = [
  { value: 0, label: "Any" },
  { value: 3, label: "3.0+" },
  { value: 4, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
];

function CheckList({
  facetKey,
  options,
  selected,
  onToggle,
  scroll = false,
}: {
  facetKey: FacetKey;
  options: FacetOption[];
  selected: string[];
  onToggle: (key: FacetKey, value: string) => void;
  scroll?: boolean;
}) {
  return (
    <ul className={`space-y-0.5 ${scroll ? "max-h-52 overflow-y-auto pr-1" : ""}`}>
      {options.map((opt) => {
        const checked = selected.includes(opt.value);
        const empty = opt.count === 0 && !checked;
        return (
          <li key={opt.value}>
            <label
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-clay-soft/40 ${
                empty ? "opacity-40" : ""
              }`}
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(facetKey, opt.value)}
                  className="h-4 w-4 rounded border-line text-clay accent-clay"
                />
                <span className={checked ? "text-ink" : "text-muted"}>{opt.value}</span>
              </span>
              <span className="text-[11px] tabular-nums text-muted/70">{opt.count}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function FacetPanel({
  filters,
  categoryFacets,
  brandFacets,
  materialFacets,
  priceBounds,
  toggleFacet,
  setFilters,
  clearFilters,
  activeFilterCount,
}: Props) {
  const setPrice = (side: "priceMin" | "priceMax", raw: string) => {
    const value = raw === "" ? null : Number(raw);
    setFilters({ ...filters, [side]: value == null || Number.isNaN(value) ? null : value });
  };

  return (
    <div className="text-ink">
      <div className="flex items-center justify-between pb-4">
        <h2 className="font-display text-lg">Filters</h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-clay-ink underline-offset-2 hover:underline"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      <Section title="Availability">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-clay-soft/40">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })}
            className="h-4 w-4 rounded border-line accent-clay"
          />
          <span className={filters.inStockOnly ? "text-ink" : "text-muted"}>In stock only</span>
        </label>
      </Section>

      <Section title="Category">
        <CheckList facetKey="categories" options={categoryFacets} selected={filters.categories} onToggle={toggleFacet} />
      </Section>

      <Section title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={filters.priceMin ?? ""}
            onChange={(e) => setPrice("priceMin", e.target.value)}
            placeholder={`$${priceBounds.min}`}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-clay/50 focus:outline-none"
            aria-label="Minimum price"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={filters.priceMax ?? ""}
            onChange={(e) => setPrice("priceMax", e.target.value)}
            placeholder={`$${priceBounds.max}`}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-clay/50 focus:outline-none"
            aria-label="Maximum price"
          />
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted/70">
          Items without a listed price are hidden when a range is set.
        </p>
      </Section>

      <Section title="Rating">
        <div className="flex gap-1.5">
          {RATING_STEPS.map((step) => (
            <button
              key={step.value}
              type="button"
              onClick={() => setFilters({ ...filters, minRating: step.value })}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition ${
                filters.minRating === step.value
                  ? "border-clay bg-clay text-paper"
                  : "border-line bg-surface text-muted hover:border-clay/40"
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Material">
        <CheckList facetKey="materials" options={materialFacets} selected={filters.materials} onToggle={toggleFacet} scroll />
      </Section>

      <Section title="Brand">
        <CheckList facetKey="brands" options={brandFacets} selected={filters.brands} onToggle={toggleFacet} scroll />
      </Section>
    </div>
  );
}
