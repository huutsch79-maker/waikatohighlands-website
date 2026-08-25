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

`sections` is a **list**, not a keyed object — that's what lets the CMS's list widget (add/remove/reorder/edit items visually) bind to it directly. `photo`, when set, is a path relative to `public/photos/` with no leading slash (e.g. `about/family.jpg`, not `/photos/about/family.jpg`). A farm-page section whose `key` starts with `mob` renders in the "Our Mobs" card grid on `/farm`; every other section renders as a plain text block. This exact shape — the list form, the `photo` convention — must stay in sync with `src/content/config.ts`'s schema here and with the JARVIS module that writes it; if one changes, change all three.

Until a photo path actually exists under `public/photos/`, pages show an honest "Photo coming soon" placeholder instead of a broken image — see `src/components/PhotoBlock.astro`.

The starter content in `src/content/pages/` is placeholder text, not real farm details — it's meant to be replaced via chat ("update the About page to say...") or the CMS, not edited as if it were final copy.

## Local dev

```
npm install
npm run dev
```

`npm run build` produces `dist/`, which is what `website-server` actually serves in production — there's no separate deploy step beyond that build.

## Follow-up: Sveltia CMS's GitHub login isn't wired up yet

Sveltia CMS (like Decap CMS before it) needs a small OAuth proxy to complete GitHub's OAuth handshake — it can't do that purely client-side from a static page. `admin/config.yml` is otherwise ready to go (backend, collections, and fields all match this repo's content shape); what's missing is that proxy. Two realistic options when this becomes worth doing:

1. Self-host a small OAuth proxy (a handful of well-known open source implementations exist for exactly this — e.g. search "netlify-cms-github-oauth-provider" or similar successors) — could run as one more tiny service alongside `website-server`.
2. Use a hosted option if one is otherwise in use for something else already (e.g. a Cloudflare Worker doing the same job).

Until that's done, `/admin` won't complete a human login. It doesn't block JARVIS's chat-driven edits at all — those authenticate straight to GitHub with a static token, no OAuth handshake involved.
