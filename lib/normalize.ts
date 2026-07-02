import type { CleanItem, RawItem } from "./types";

/**
 * Normalization layer — the heart of the "decisions around search".
 *
 * The catalog is deliberately messy: prices arrive as numbers, comma-formatted
 * strings, nulls and zeros; titles come ALL CAPS, all-lowercase or padded with
 * whitespace; images are frequently null or point at a dead host; and the
 * `description` field routinely contradicts the title/category/tags.
 *
 * We clean everything here, once, so the rest of the app can trust its inputs.
 */

// A dead host that appears on ~168 records. Those URLs 404, so we treat any
// image served from it as missing and fall back to a placeholder tile.
const DEAD_IMAGE_HOST = "cdn.catalog.example";

// Material vocabulary lifted from the tag set. Used to derive a first-class
// "material" facet even though the data never exposes it as its own field.
const MATERIALS = [
  "bamboo",
  "brass",
  "ceramic",
  "glass",
  "leather",
  "linen",
  "marble",
  "oak",
  "rattan",
  "steel",
  "terracotta",
  "velvet",
  "walnut",
  "wool",
];
const MATERIAL_SET = new Set(MATERIALS);

/**
 * Parse a price that may be a number, a comma-formatted string, null or 0.
 * Returns a real number, or null to mean "price unavailable / on request".
 * We treat 0 as missing because a $0 home-goods listing is a data error, and
 * silently sorting those to the top of "price ascending" would be misleading.
 */
export function parsePrice(raw: RawItem["price"]): number | null {
  if (raw === null || raw === undefined) return null;

  let value: number;
  if (typeof raw === "number") {
    value = raw;
  } else {
    // Strip currency symbols, thousands separators and stray whitespace.
    const cleaned = raw.replace(/[^0-9.]/g, "");
    if (cleaned === "") return null;
    value = Number.parseFloat(cleaned);
  }

  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

const TITLE_CASE_WORD = /\S+/g;

/** Title-case a token: first letter up, the rest down ("OAK" -> "Oak"). */
function titleCaseToken(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

/**
 * Clean a title for display. We always trim and collapse internal whitespace.
 * When a title is entirely uppercase or entirely lowercase (the "shouty" and
 * "sloppy" records) we title-case it so the grid reads consistently. Naturally
 * mixed-case titles are left untouched to preserve brand styling like
 * "Hand-thrown" or "Sol & Stone".
 */
export function cleanTitle(raw: string): { title: string; wasMessy: boolean } {
  const collapsed = raw.trim().replace(/\s+/g, " ");
  const hadWhitespaceNoise = collapsed !== raw;

  const hasLower = /[a-z]/.test(collapsed);
  const hasUpper = /[A-Z]/.test(collapsed);
  const isAllCaps = hasUpper && !hasLower;
  const isAllLower = hasLower && !hasUpper;

  let title = collapsed;
  if (isAllCaps || isAllLower) {
    title = collapsed.replace(TITLE_CASE_WORD, titleCaseToken);
  }

  return { title, wasMessy: hadWhitespaceNoise || isAllCaps || isAllLower };
}

/** Pull the first recognized material out of the tag list, capitalized. */
export function deriveMaterial(tags: string[]): string | null {
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (MATERIAL_SET.has(key)) return titleCaseToken(key);
  }
  return null;
}

/** Return a usable image URL, or null if it's missing or from the dead host. */
export function resolveImage(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const host = new URL(raw).host;
    if (host === DEAD_IMAGE_HOST) return null;
  } catch {
    return null; // malformed URL — treat as missing
  }
  return raw;
}

/** Normalize a single raw record into the trusted CleanItem shape. */
export function normalizeItem(raw: RawItem): CleanItem {
  const { title, wasMessy } = cleanTitle(raw.title);
  const price = parsePrice(raw.price);
  const image = resolveImage(raw.image);
  const releasedTimestamp = Date.parse(raw.releasedAt);

  return {
    id: raw.id,
    title,
    brand: raw.brand,
    category: raw.category,
    tags: raw.tags ?? [],
    material: deriveMaterial(raw.tags ?? []),
    price,
    rating: raw.rating,
    reviews: raw.reviews ?? 0,
    inStock: Boolean(raw.inStock),
    releasedAt: raw.releasedAt,
    releasedTimestamp: Number.isNaN(releasedTimestamp) ? 0 : releasedTimestamp,
    image,
    imageWidth: raw.imageWidth,
    imageHeight: raw.imageHeight,
    description: raw.description,
    flags: {
      missingImage: image === null,
      missingPrice: price === null,
      messyTitle: wasMessy,
    },
  };
}

export function normalizeAll(raw: RawItem[]): CleanItem[] {
  return raw.map(normalizeItem);
}

export { MATERIALS };
