import type { ItemFlags } from "@/lib/types";
import { ImageOffIcon, TagOffIcon } from "./icons";

/**
 * The "data health" touch. Instead of hiding the catalog's rough edges, we name
 * them: a subtly-styled chip whenever a record is missing an image or a usable
 * price. It signals the app is aware of its data quality rather than pretending
 * everything is pristine.
 */
export function DataHealthBadges({
  flags,
  size = "sm",
}: {
  flags: ItemFlags;
  size?: "sm" | "md";
}) {
  const items: { key: string; label: string; icon: React.ReactNode }[] = [];
  if (flags.missingImage) {
    items.push({ key: "img", label: "No image", icon: <ImageOffIcon className="h-3 w-3" /> });
  }
  if (flags.missingPrice) {
    items.push({ key: "price", label: "Price on request", icon: <TagOffIcon className="h-3 w-3" /> });
  }
  if (items.length === 0) return null;

  const pad = size === "md" ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[10px]";

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((it) => (
        <span
          key={it.key}
          className={`inline-flex items-center gap-1 rounded-full border border-line bg-clay-soft/70 font-medium tracking-wide text-clay-ink ${pad}`}
        >
          {it.icon}
          {it.label}
        </span>
      ))}
    </div>
  );
}
