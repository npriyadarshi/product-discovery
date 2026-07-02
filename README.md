# Maison — home goods product discovery

A small, focused product-discovery page over a ~4,000-item home-goods catalog.
The brief said it plainly: _we care more about the decisions around search than
the search itself._ So this README leads with those decisions.

> **Live demo:** enable GitHub Pages (Settings → Pages → Source: **GitHub Actions**)
> and push to `main`. The site publishes to `https://<user>.github.io/<repo>/`.

---

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # static export to ./out
```

Node 20+ recommended. No backend, no environment variables required for local dev.

---

## What I built

- **Instant, typo-tolerant search** as you type (MiniSearch, prefix + fuzzy).
- **Faceted filtering** — category, brand, material, price range, rating, in-stock —
  with live sibling counts that respect your other selections.
- **Sort** — relevance, price (nulls sink), top-rated, newest.
- **Product cards → detail drawer**, with graceful states for missing data.
- **Query suggestions** and a **"did you mean"** recovery on zero results.
- **Static export deployed to GitHub Pages** via GitHub Actions.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS v4 · MiniSearch.

---

## The data is dirty on purpose — and that drove every decision

I opened the file first. It's intentionally messy, and each quirk shaped the build:

| What the data does | How the app responds |
| --- | --- |
| `price` is a number, a comma string (`"1,081.43"`), `null`, or `0` (141 strings, 164 null, 14 zero) | `parsePrice` strips commas/symbols, coerces types, and treats `null`/`0` as **"Price on request."** Null prices always **sink to the bottom** of price sorts and are hidden when a price range is set. |
| `title` arrives ALL CAPS, all-lowercase, or padded with whitespace (58 records) | `cleanTitle` trims/collapses, and title-cases only the shouty/sloppy ones — mixed-case titles are left alone to preserve styling. |
| `image` is `null` or points at a dead host `cdn.catalog.example` (351 unusable) | `resolveImage` rejects both; cards render a calm, category-tinted placeholder, plus an `onError` guard for live load failures. |
| `description` frequently **contradicts** the record (a "Velvet Lantern" described as a bamboo blanket) | **Description is not indexed for search at all.** Trusting it would poison relevance. |

**The most important search decision:** index only the trustworthy signal —
`title` (boost ×4), `material` and `tags` (×2), `brand` and `category` (×1.5) —
and deliberately exclude `description`.

I also made the data quality **visible** rather than hidden: cards carry a small
dot and the detail drawer shows "No image" / "Price on request" chips. The app
knows what it doesn't know.

---

## Architecture

```
lib/normalize.ts       # RawItem -> CleanItem: prices, titles, images, material  (the decisions)
lib/search.ts          # MiniSearch config, field boosts, "did you mean", suggestions
lib/format.ts          # display formatting + category placeholder tints
hooks/useProductSearch # load -> index -> query -> filter -> sort -> window, all memoized
components/*            # SearchBar, FacetPanel, SortControl, ProductCard, ProductDetail, ...
app/page.tsx            # composition + loading / empty / error states
```

Everything runs client-side: the catalog is fetched once, normalized, and indexed
in-browser. `description` is excluded from the index; facet counts are computed
against the other active filters so multi-select still shows siblings.

---

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`. `.github/workflows/deploy.yml` builds a static export and
   publishes it. The workflow sets `NEXT_PUBLIC_BASE_PATH=/<repo>` so assets and
   the `items.json` fetch resolve under the Pages subpath.

---

## The tradeoff I'd watch

Indexing entirely in the browser gives an amazing instant experience with **zero
infrastructure** — and it's exactly why this runs on GitHub Pages. But the whole
catalog ships to every client and the index rebuilds on load; that's fine at
~4,000 items and won't be past a few tens of thousands. The next step there is a
**server-side index** (Typesense / Meilisearch / Algolia) with the same
normalization applied at ingest — the `lib/normalize.ts` boundary is built so
that move wouldn't touch the UI.

A secondary tradeoff: excluding `description` boosts precision but could miss a
legitimate match that only lived in that field. Given how often it contradicts
the record here, precision was the right call — but it's a dial, not a doctrine.

---

## What I left out (scope)

Cart/checkout, auth, a backend, URL-synced filter state, and real product imagery.
Deliberately kept small — this is a discovery surface, not a store.
