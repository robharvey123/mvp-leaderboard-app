// src/context/OrgTheme.tsx
import React, { useEffect } from "react";
import { useOrg } from "./OrgContext";

/** Supported palette keys that match your CSS tokens (e.g. --brand-600). */
type Shade = "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
type BrandPalette = Partial<Record<Shade, string>>;

function hexToRgbTriplet(hex: string): string {
  // Accepts "#rrggbb" or "rrggbb". Returns "r g b" (space-separated) for use in rgb(var(--brand-600))
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return "0 0 0";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function setVar(name: string, hex?: string) {
  if (!hex) return;
  document.documentElement.style.setProperty(name, hexToRgbTriplet(hex));
}

/**
 * OrgTheme
 * - Reads brand palette/primary from OrgContext (if present)
 * - Updates CSS custom properties to re-theme the app
 *
 * Expected shapes it can handle:
 *  - org.theme?.brandPalette?: Record<Shade, hex>
 *  - org.brand_palette?: Record<Shade, hex>
 *  - org.theme?.brand?: hex   (single primary colour)
 *  - org.brand?: hex          (single primary colour)
 */
function OrgTheme({ children }: { children: React.ReactNode }) {
  // Try to get org from context; if Provider isn't mounted yet, swallow the error.
  let org: any = undefined;
  try {
    org = useOrg();
  } catch {
    // no-op
  }

  // Prefer a full palette if available
  const palette: BrandPalette =
    org?.theme?.brandPalette ||
    org?.brand_palette ||
    undefined;

  // Fallback single brand colour if no palette provided
  const primaryHex: string | undefined =
    org?.theme?.brand ||
    org?.brand ||
    undefined;

  useEffect(() => {
    // If a full palette exists, set all brand shades
    if (palette && Object.keys(palette).length > 0) {
      (["50","100","200","300","400","500","600","700","800","900"] as Shade[]).forEach((k) => {
        const val = palette[k];
        if (val) setVar(`--brand-${k}`, val);
      });
      return;
    }

    // Otherwise, if only a single colour is provided, at least set the core shades
    if (primaryHex) {
      // Set a few key stops; your tokens.css already has sensible defaults for others
      setVar("--brand-400", primaryHex);
      setVar("--brand-500", primaryHex);
      setVar("--brand-600", primaryHex);
      setVar("--brand-700", primaryHex);
    }
  }, [
    primaryHex,
    // change effect when palette contents change
    JSON.stringify(palette || {}),
  ]);

  return <>{children}</>;
}

// Export both default and named to satisfy any import style.
export { OrgTheme };
export default OrgTheme;
