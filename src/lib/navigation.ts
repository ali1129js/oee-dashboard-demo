export const PAGE_IDS = [
  "uebersicht",
  "linienuebersicht",
  "historie",
  "einstellungen",
] as const;
export type PageId = (typeof PAGE_IDS)[number];

export const PAGE_LABELS: Record<PageId, string> = {
  uebersicht: "Übersicht",
  linienuebersicht: "Linienübersicht",
  historie: "Historie",
  einstellungen: "Einstellungen",
};

/** Unknown hashes fall back to Übersicht. */
export function pageFromHash(hash: string): PageId {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  return PAGE_IDS.includes(id as PageId) ? (id as PageId) : "uebersicht";
}
