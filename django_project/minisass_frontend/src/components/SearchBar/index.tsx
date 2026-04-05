import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { globalVariables } from "../../utils";

interface SearchResult {
  id: number;
  name: string;
  river_name?: string;
  type: "site";
}

interface SearchBarProps {
  /** "compact" = expandable icon in header, "prominent" = full-width on-page */
  variant?: "compact" | "prominent";
}

const SearchBar: React.FC<SearchBarProps> = ({ variant = "compact" }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  // Close dropdown & collapse on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (variant === "compact" && !query) setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [variant, query]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${globalVariables.baseUrl}/monitor/sites/?search=${encodeURIComponent(q)}`
      );
      const data = response.data?.results ?? response.data ?? [];
      const mapped: SearchResult[] = (Array.isArray(data) ? data : [])
        .slice(0, 8)
        .map((s: any) => ({
          id: s.gid ?? s.id,
          name: s.site_name ?? s.name ?? "Unknown site",
          river_name: s.river_name,
          type: "site" as const,
        }));
      setResults(mapped);
      setOpen(mapped.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (variant === "compact") setExpanded(false);
    navigate(`/map?site=${result.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      if (variant === "compact") setExpanded(false);
    }
  };

  const handleIconClick = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Compact: icon-only that expands
  if (variant === "compact" && !expanded) {
    return (
      <button
        onClick={handleIconClick}
        className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-muted"
        aria-label="Search sites or rivers"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    );
  }

  const isProminent = variant === "prominent";

  return (
    <div ref={wrapperRef} className="relative">
      <div className={`flex items-center transition-all focus-within:border-accent focus-within:ring-1 focus-within:ring-accent ${
        isProminent
          ? "rounded-xl border border-surface-subtle bg-white px-4 py-3 shadow-sm"
          : "rounded-tr-xl rounded-bl-xl rounded-br-xl border border-surface-subtle bg-surface-muted/50 px-3 py-1.5 animate-in slide-in-from-right-2"
      }`}>
        <svg className={`flex-shrink-0 text-text-muted ${isProminent ? "mr-3 h-5 w-5" : "mr-2 h-4 w-4"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search sites or rivers..."
          className={`w-full bg-transparent text-text outline-none placeholder:text-text-muted ${
            isProminent ? "text-body" : "text-body-sm"
          }`}
          aria-label="Search sites or rivers"
        />
        {loading && (
          <div className={`animate-spin rounded-full border-2 border-surface-subtle border-t-accent ${
            isProminent ? "ml-3 h-5 w-5" : "ml-2 h-4 w-4"
          }`} />
        )}
        {variant === "compact" && (
          <button
            onClick={() => { setQuery(""); setOpen(false); setExpanded(false); }}
            className="ml-1 flex-shrink-0 rounded-full p-0.5 text-text-muted hover:text-text"
            aria-label="Close search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-surface-subtle bg-surface shadow-card">
          <ul role="listbox">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => handleSelect(r)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-muted"
                  role="option"
                >
                  <svg className="h-4 w-4 flex-shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm font-medium text-text">{r.name}</span>
                    {r.river_name && (
                      <span className="block truncate text-caption text-text-muted">{r.river_name}</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
