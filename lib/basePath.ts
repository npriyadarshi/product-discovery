// On GitHub Pages the site is served from /<repo>/, so client-side fetches and
// asset URLs need that prefix. Locally NEXT_PUBLIC_BASE_PATH is empty.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}
