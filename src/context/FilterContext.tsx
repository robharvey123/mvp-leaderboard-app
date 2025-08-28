// src/context/FilterContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * A single filter value. Keep this broad enough for common UI widgets.
 * (If you need complex objects later, widen this type.)
 */
export type FilterValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number>;

export type Filters = Record<string, FilterValue>;

export type FilterCtxValue = {
  /** Current filter map */
  filters: Filters;

  /** Set/replace a single key’s value */
  setFilter: (key: string, value: FilterValue) => void;

  /** React-style setter for the whole map */
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;

  /** Merge a partial patch into the filter map */
  setMany: (patch: Partial<Filters>) => void;

  /** Remove a single key */
  remove: (key: string) => void;

  /** Reset all filters to empty */
  reset: () => void;

  /** Read a value with a hint type */
  get: <T = FilterValue>(key: string) => T | undefined;

  /** Convenience toggle helper for boolean-like filters */
  toggle: (key: string, truthy?: FilterValue, falsy?: FilterValue) => void;

  /** Is a given key currently set to a truthy value? */
  isActive: (key: string) => boolean;
};

const FilterCtx = createContext<FilterCtxValue | undefined>(undefined);

export type FilterProviderProps = {
  children: ReactNode;
  /** Optional initial filters (e.g., seed from org/season/team) */
  initial?: Partial<Filters>;
};

export function FilterProvider({ children, initial }: FilterProviderProps) {
  const [filters, setFilters] = useState<Filters>({ ...(initial ?? {}) });

  const setFilter = (key: string, value: FilterValue) => {
    setFilters((prev) => {
      // If value is undefined, treat as removal for cleaner URLs/state
      if (value === undefined) {
        const { [key]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const setMany = (patch: Partial<Filters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      // scrub undefineds to avoid clutter
      Object.keys(next).forEach((k) => {
        if (next[k] === undefined) delete (next as any)[k];
      });
      return next;
    });
  };

  const remove = (key: string) =>
    setFilters((prev) => {
      const { [key]: _omit, ...rest } = prev;
      return rest;
    });

  const reset = () => setFilters({});

  const get = <T = FilterValue,>(key: string) => filters[key] as T | undefined;

  const toggle = (
    key: string,
    truthy: FilterValue = true,
    falsy: FilterValue = false
  ) => {
    const cur = filters[key];
    const next = cur === truthy ? falsy : truthy;
    setFilter(key, next);
  };

  const isActive = (key: string) => Boolean(filters[key]);

  const value = useMemo<FilterCtxValue>(
    () => ({
      filters,
      setFilter,
      setFilters,
      setMany,
      remove,
      reset,
      get,
      toggle,
      isActive,
    }),
    [filters]
  );

  return <FilterCtx.Provider value={value}>{children}</FilterCtx.Provider>;
}

/**
 * Strict hook: throws if no provider is found.
 * Use this in places where having filters is mandatory.
 */
export function useFilters(): FilterCtxValue {
  const ctx = useContext(FilterCtx);
  if (!ctx) {
    throw new Error("useFilter/useFilters must be used within <FilterProvider>");
  }
  return ctx;
}

/** Back-compat alias if some files import `useFilter()` instead of `useFilters()` */
export const useFilter = useFilters;

/**
 * Tolerant hook: NEVER throws. Returns a no-op stub when provider is missing.
 * Use this to prevent crashes during refactors or on pages that can work without filters.
 */
export function useFiltersOptional(): FilterCtxValue {
  const ctx = useContext(FilterCtx);
  if (ctx) return ctx;

  // no-op implementations (stable identities)
  const noop = () => {};
  const noopDispatch = noop as unknown as React.Dispatch<
    React.SetStateAction<Filters>
  >;

  return {
    filters: {},
    setFilter: noop,
    setFilters: noopDispatch,
    setMany: noop,
    remove: noop,
    reset: noop,
    get: () => undefined,
    toggle: noop,
    isActive: () => false,
  };
}
