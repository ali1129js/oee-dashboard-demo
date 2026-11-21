export const PAGE_IDS = ["uebersicht", "linienuebersicht"] as const;
export type PageId = (typeof PAGE_IDS)[number];

export const PAGE_LABELS: Record<PageId, string> = {
  uebersicht: "Übersicht",
  linienuebersicht: "Linienübersicht",
};

/** Unknown hashes, including the later placeholder tabs, fall back to Übersicht. */
export function pageFromHash(hash: string): PageId {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  return id === "linienuebersicht" ? "linienuebersicht" : "uebersicht";
}
