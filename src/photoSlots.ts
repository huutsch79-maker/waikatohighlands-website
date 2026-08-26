export interface PhotoSlot {
  number: number;
  page: string;
  section: string;
  label: string;
}

/**
 * Stable, explicit numbering for every photo slot on the site — referenced
 * in chat as "photo 1", "photo 2", etc. so a photo can be swapped without
 * spelling out the exact page and section every time ("swap photo 2 for
 * this one" instead of "swap the welcome section's photo on the home
 * page"). Numbers are assigned here by hand, not computed from render
 * order, specifically so they stay stable: a slot keeps its number even
 * if a page's other content changes, and a removed slot's number is never
 * reused. Add new slots at the end.
 *
 * When editing pages/*.astro, keep every PhotoBlock/Hero call's
 * slotNumber prop in sync with this list — see slotNumberFor() below.
 */
export const PHOTO_SLOTS: PhotoSlot[] = [
  { number: 1, page: "home", section: "hero", label: "Home page hero photo" },
  { number: 2, page: "home", section: "welcome", label: "Home page welcome section photo" },
  { number: 3, page: "about", section: "intro", label: "About page family photo" },
  { number: 4, page: "farm", section: "mob-1", label: "Farm page — Mob One photo" },
  { number: 5, page: "farm", section: "mob-2", label: "Farm page — Mob Two photo" },
  { number: 6, page: "farm", section: "mob-3", label: "Farm page — Mob Three photo" },
];

export function slotNumberFor(page: string, section: string): number | undefined {
  return PHOTO_SLOTS.find((s) => s.page === page && s.section === section)?.number;
}
