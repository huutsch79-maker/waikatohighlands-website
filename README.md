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

`sections` is a **list**, not a keyed object — that's what lets the CMS's list widget (add/remove/reorder/edit items visually) bind to it directly. `photo`, when set, is a path relative to `src/assets/photos/` with no leading slash (e.g. `about/family.jpg`, not `/photos/about/family.jpg`). A farm-page section whose `key` starts with `mob` renders in the "Our Mobs" card grid on `/farm`; every other section renders as a plain text block. This exact shape — the list form, the `photo` convention — must stay in sync with `src/content/config.ts`'s schema here and with the JARVIS module that writes it; if one changes, change all three.

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

Sveltia CMS (like Decap CMS before it) needs a small OAuth client to complete GitHub's OAuth handshake — it can't do that purely client-side from a static page. `admin/config.yml` is otherwise ready to go (backend, collections, and fields all match this repo's content shape); what's missing is pointing it at a deployed OAuth worker. This doesn't block JARVIS's chat-driven edits at all — those authenticate straight to GitHub with a static token, no OAuth handshake involved. It only blocks a human logging into `/admin`.

Use Sveltia's own maintained worker, [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth), rather than a hand-rolled proxy — it's already built for exactly this and shouldn't be reimplemented or vendored into this repo.

1. **Register a GitHub OAuth App** — GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: `https://waikatohighlands.com`
   - Authorization callback URL: `https://sveltia-cms-auth.<your-subdomain>.workers.dev/callback` (you'll know the real subdomain after step 2 — come back and set this once deployed).
   - Note the generated Client ID and Client Secret.
2. **Deploy the worker** — clone `sveltia/sveltia-cms-auth` and run `wrangler deploy` (or use its one-click Cloudflare deploy button). This is a separate small Cloudflare Worker, not part of this repo — it could run alongside `website-server`'s Cloudflare Tunnel setup, or as its own Worker, since Workers don't need the NUC at all.
3. **Set the worker's environment variables** in the Cloudflare dashboard (Settings → Variables) for that Worker:
   - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — from step 1.
   - `ALLOWED_DOMAINS` — set to `waikatohighlands.com` so only this site can use it.
4. **Go back and fix the callback URL** in the GitHub OAuth App (step 1) to match the real Worker URL Cloudflare assigned.
5. **Uncomment `base_url` in `admin/config.yml`** and set it to that same Worker URL, then commit.

Once all five steps are done, `/admin` will complete GitHub logins for human editors.
