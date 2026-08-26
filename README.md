# waikatohighlands.com

An [Astro](https://astro.build) site with a [Sveltia CMS](https://github.com/sveltia/sveltia-cms) admin, edited two ways:

- **Through JARVIS chat** — the `farm-website` capability module (in the separate JARVIS repo, `src/modules/website/`) commits directly to this repo via GitHub's Contents API.
- **Through the CMS admin** at `/admin` — a human editor, no code required.

Both write the exact same files, so neither can conflict with the other — they're just two contributors to the same git history. Content is deliberately kept in this repo and not the JARVIS one: a token scoped to just this repo can never touch JARVIS's own source, and a family member editing a photo here has no reason to need JARVIS repo access to do it.

## How it's served

Not by a static host (Netlify/Vercel/etc.) — this repo's own build output is served by a small container (`website-server/` in the JARVIS repo) running on the same NUC as JARVIS itself, reached through the Cloudflare Tunnel that already serves `jarvis.waikatohighlands.com`. That container clones this repo, runs `npm ci && npm run build`, and serves `dist/`. It re-pulls and rebuilds on demand — every edit here (from JARVIS or the CMS) triggers that immediately, so changes go live in seconds, not on a schedule.

## Content shape

`src/content/pages/*.json` — one file per page:

```json
{
  "title": "About Us",
  "sections": [
    { "key": "intro", "heading": "Our Family", "body": "...", "photo": "about/family.jpg" }
  ]
}
```

`sections` is a **list**, not a keyed object — that's what lets the CMS's list widget (add/remove/reorder/edit items visually) bind to it directly. `photo`, when set, is a path relative to `src/assets/photos/` with no leading slash (e.g. `about/family.jpg`, not `/photos/about/family.jpg`). Any section on any page can carry a photo. On the farm page specifically, a section whose `key` starts with `mob` renders as a card in the "Our Mobs" grid; any other farm section renders as a plain text block, or — the moment it has a `photo` set or an entry in `src/photoSlots.ts` — a side-by-side text+photo row instead, no template change required either way. This exact shape — the list form, the `photo` convention — must stay in sync with `src/content/config.ts`'s schema here and with the JARVIS module that writes it; if one changes, change all three.

Every photo slot on the site (whether filled or still a placeholder) has a stable, hand-assigned number in `src/photoSlots.ts`, referenced in chat as "photo 1", "photo 2", etc. — see that file's own comments for the convention.

Until a photo path actually exists under `src/assets/photos/`, pages show an honest "Photo coming soon" placeholder instead of a broken image — see `src/components/PhotoBlock.astro`.

### Image pipeline

Photos live under `src/assets/photos/`, not `public/`. This isn't cosmetic: only images under `src/` go through Astro's real build-time image pipeline (`astro:assets`) — resize, re-encode to AVIF, and a real `srcset` for different viewport widths. Anything dropped in `public/` gets served exactly as uploaded, at whatever resolution and format it came in, which is what caused the original hero photo to look soft/pixelated once the browser scaled it up. `Hero.astro` and `PhotoBlock.astro` both resolve a `photo` path against `src/assets/photos/` via `import.meta.glob(..., { eager: true })` (Vite's way of importing every file under a directory into a lookup map, since the exact filename isn't known until content is read), then render it through `<Image>` instead of a plain `<img>`. JARVIS's `website.replacePhoto` and the CMS media library both write to this same directory — the `photo` field's value is unaffected, just the actual bytes' location changed.

The starter content in `src/content/pages/` is placeholder text, not real farm details — it's meant to be replaced via chat ("update the About page to say...") or the CMS, not edited as if it were final copy.

## Local dev

```
npm install
npm run dev
```

`npm run build` produces `dist/`, which is what `website-server` actually serves in production — there's no separate deploy step beyond that build.

## GitHub OAuth login for /admin

Sveltia CMS (like Decap CMS before it) needs a small OAuth client to complete GitHub's OAuth handshake — it can't do that purely client-side from a static page. This doesn't block JARVIS's chat-driven edits at all — those authenticate straight to GitHub with a static token, no OAuth handshake involved. It only affects a human logging into `/admin`.

Deployed: [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) (Sveltia's own maintained worker, not a hand-rolled proxy) is live at `https://sveltia-cms-auth.huutsch79.workers.dev`, referenced by `base_url` in `admin/config.yml`. Its GitHub OAuth App restricts logins to `waikatohighlands.com` via the Worker's `ALLOWED_DOMAINS` variable.

To redeploy or rotate credentials later: clone `sveltia/sveltia-cms-auth`, `npx wrangler deploy`, and set `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`/`ALLOWED_DOMAINS` in that Worker's Cloudflare dashboard settings (Settings → Variables and Secrets). A new deploy keeps the same URL as long as the Worker name is unchanged, so `admin/config.yml`'s `base_url` and the GitHub OAuth App's callback URL don't need to change with it.
