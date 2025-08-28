// src/lib/club.ts
/** Read the current club id from localStorage (or env default if you wire it in). */
export function getActiveClubId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("org:last");
}

/** Persist the chosen club id and return it. */
export function setActiveClubId(id: string) {
  if (typeof window !== "undefined") localStorage.setItem("org:last", id);
}
