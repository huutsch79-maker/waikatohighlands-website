import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * One JSON file per page under src/content/pages/*.json, each becoming one
 * "pages" entry keyed by its filename (so src/content/pages/about.json is
 * getEntry("pages", "about")). `sections` is a list (not a keyed map)
 * specifically so the Sveltia CMS admin's "list" widget (admin/config.yml)
 * can bind to it directly — add/reorder/edit items visually, each with
 * its own `key`. JARVIS's farm-website module
 * (waikatohighlands/src/modules/website/index.ts in the JARVIS repo)
 * writes this exact same on-disk shape, converting to/from a keyed map
 * only for its own chat-facing payloads. Keep all three in sync if this
 * schema ever changes.
 */
const pages = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    sections: z.array(
      z.object({
        key: z.string(),
        heading: z.string().optional(),
        body: z.string(),
        /** Relative path under public/photos/, e.g. "farm/mob-1.jpg". */
        photo: z.string().optional(),
      }),
    ),
  }),
});

export const collections = { pages };
