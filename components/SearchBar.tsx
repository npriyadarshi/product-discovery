"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SearchIcon, CloseIcon } from "./icons";

interface Props {
  value: string;
  onChange: (value: string) => void;
  getSuggestions: (text: string) => string[];
  isSearching: boolean;
}

export function SearchBar({ value, onChange, getSuggestions, isSearching }: Props) {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const text = value.trim();
    setSuggestions(text.length >= 2 ? getSuggestions(text) : []);
    setActive(-1);
  }, [value, getSuggestions]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const open = focused && suggestions.length > 0 && value.trim().length >= 2;

  const choose = (s: string) => {
    onChange(s);
    setFocused(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]);
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3.5 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition focus-within:border-clay/50 focus-within:shadow-[0_10px_30px_-20px_rgba(90,60,35,0.6)]">
        <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Search 4,000 home goods — try “rattan”, “oak table lamp”…"
          className="w-full bg-transparent text-[15px] text-ink placeholder:text-muted/70 focus:outline-none"
        />
        {isSearching && (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-clay" />
        )}
        {value && !isSearching && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-1 text-muted transition hover:bg-line/60 hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-[0_20px_50px_-24px_rgba(60,45,30,0.6)]"
        >
          {suggestions.map((s, i) => (
            <li key={s} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(s)}
                className={`flex w-full items-center gap-3 px-5 py-2 text-left text-sm ${
                  i === active ? "bg-clay-soft/70 text-ink" : "text-muted"
                }`}
              >
                <SearchIcon className="h-4 w-4 opacity-60" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
