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

A single-page discovery surface with search and Amazon-style faceted filtering:

- **Instant, typo-tolerant search** as you type — a two-pass engine (MiniSearch
  weighted prefix + fuzzy, plus a substring/infix fallback so mid-word fragments
  like `eath` → l**eath**er still match).
- **Faceted filtering** — category, brand, material, **tags** (searchable, 83 of
  them), price range, rating, in-stock, and **“price on request”**. Multiple
  values in one facet OR together; different facets AND; typed search ANDs on top.
- **Live sibling counts** on every facet that respect your other selections.
- **Multi-select “Popular” chips** that are shortcuts into the Tags facet — pick
  several, they persist as removable pills, and you keep narrowing by typing.
- **Sort** — relevance, price (unpriced items sink), top-rated, newest.
- **Product cards → detail drawer**, uniform card sizing, graceful missing-data states.
- **Query suggestions** and a **“did you mean”** recovery on zero results.
- **Responsive** from a 1-column phone layout up to a 4-column desktop grid.
- **Static export deployed to GitHub Pages** via GitHub Actions.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS v4 · MiniSearch.

---

## What the data told me (the salient points)

I opened `items.json` before writing any code. It's 4,000 items across **10
categories** (Bath, Decor, Furniture, Kitchen, Lighting, Office, Outdoor, Storage,
Textiles, Wall Art), **16 brands**, and **83 tags** — and it's deliberately messy.
The mess is the point of the exercise, and each quirk drove a decision:

| What the data does | How the app responds |
| --- | --- |
| `price` is a number, a comma-string (`"1,081.43"`), `null`, or `0` (141 strings, 164 null, 14 zero → **178 unpriced**) | `parsePrice` strips commas/symbols and coerces types; `null`/`0` become **“Price on request.”** Unpriced items **sink to the bottom** of price sorts, are hidden when a range is set, and have their own **“Price on request only”** filter. |
| `title` is sometimes ALL CAPS, all-lowercase, or whitespace-padded (**58 records**) | `cleanTitle` trims/collapses whitespace and title-cases only the shouty/sloppy ones — mixed-case titles are left alone to preserve intentional styling. |
| `image` is `null` (183) or points at a dead host `cdn.catalog.example` (168) → **351 unusable** | `resolveImage` rejects both; cards render a calm, category-tinted placeholder, with an `onError` guard for live load failures too. |
| `description` frequently **contradicts** the record — a “Velvet Lantern” described as a bamboo blanket (**207 also null**) | **Description is never indexed for search.** Trusting it would poison relevance. |
| `rating` is `null` for the **205** items with zero reviews | Shown as “—” and treated as unrated (excluded by a minimum-rating filter, not counted as 0★). |

The takeaway: **every field can lie or be missing, so nothing is trusted until
it's normalized.** That happens once, at load, turning each `RawItem` into a
`CleanItem` the rest of the app can rely on.

---

## The decisions (and the trade-offs)

**1. Index only trustworthy signal; exclude `description`.**
Search weights `title` ×4, `material` and `tags` ×2, `brand` and `category` ×1.5;
`description` is left out entirely.
*Trade-off:* precision over recall — a match that lived only in a description is
missed. Given how often descriptions contradict the record here, that was the
right call, but it's a dial, not a doctrine.

**2. Two-pass search so word fragments work.**
MiniSearch only matches the *start* of a word (prefix) or a small edit distance
(fuzzy) — so typing the *middle or end* of a word (`eath` → l**eath**er) returns
nothing. So search runs two passes and unions them: (1) MiniSearch's weighted
prefix+fuzzy matches, ranked first; (2) an **infix fallback** where every 2+ char
fragment must appear somewhere in the item's trusted text, appended after.
*Trade-off:* recall-first, so short fragments can pull in loosely-related items —
but strong weighted matches always sit on top, and it's ~4,000 substring checks
per keystroke (sub-millisecond), so it stays fully client-side.

**3. Standard faceted logic — OR within a facet, AND across facets.**
Multiple values in one facet OR together (Bath *or* Kitchen); different facets AND
(Bath *and* under $200 *and* 4★+); typed search ANDs on top. Facet counts are
recomputed against your *other* selections, so multi-select still shows meaningful
sibling counts.

**4. The “Popular” chips and the Tags facet are one thing.**
Rather than two competing concepts, the top chips are shortcuts into the Tags
facet — selecting a chip checks it in the facet and adds a removable pill.
*Trade-off:* the chip labels had to become real tags (so they actually filter),
which is why they're `lamp`/`vase`/`handwoven` rather than free-text like “kitchen”.

**5. “Price on request” is its own filter, mutually exclusive with the range.**
You can filter *to* the 178 unpriced items; while that's on, the min/max range is
disabled (the two would always contradict).

**6. Data quality is visible, not hidden.**
Cards carry a small dot and the detail drawer shows “No image” / “Price on
request” chips. The app tells you what it doesn't know instead of faking it.

---

## Architecture

```
lib/normalize.ts       # RawItem -> CleanItem: prices, titles, images, material  (the decisions)
lib/search.ts          # two-pass engine: MiniSearch (weighted prefix+fuzzy) + infix corpus
lib/format.ts          # display formatting + category placeholder tints
lib/constants.ts       # popular tags, sort options, page size
hooks/useProductSearch # load -> normalize -> index -> query -> filter -> sort -> window
components/*           # SearchBar, PopularChips, FacetPanel, ActiveFilters, ProductCard, ProductDetail, ...
app/page.tsx           # composition + loading / empty / error states
```

Everything runs client-side: the catalog is fetched once, normalized, indexed and
filtered in-browser. `description` is excluded from the index; facet counts are
computed against the other active filters so multi-select still shows siblings.

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
