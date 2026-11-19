# PackArcade NEXT — Anonymous Browser Arcade

**Preview build, not a verified production acceptance release.** Replaces the public home and game-player experience, with no account, creator studio or site publishing UI.

## What is included

- Desktop screenshot-inspired dark-purple windowed arcade, sidebar, search, featured game, curated game cards, live popularity panel, recent-play strip, and mobile-first bottom navigation.
- One shared `public/game-catalog.json` with 69 entries: 66 existing repository game entrypoints and three newly created standalone games (`Neon Serpent`, `Orbit Rally`, `Crystal Memory`). Existing game binary/media/assets are NOT duplicated or deleted.
- Actual locally saved favorites, recents, game-launch links and game-player UI. Local saves do not follow you to another browser or device.
- A genuine playable iframe host with fullscreen (where browser permits), restart, open-direct, favorite, orientation layout, and recommended games.
- Anonymous aggregate Supabase analytics for game launches and submitted game searches. No Supabase users, player accounts, stored personal identifiers, or server-side user profiles. Rankings use observed views only; when counts are unavailable, the UI does not invent popularity figures. Local recommendations also consider category interests on the same browser.
- A `tools/import-github-game.mjs` importer that downloads a license-allowlisted GitHub browser game with pinned commit and verifies each Git blob SHA. Imported content still requires game review before publication.
- Three new original touchscreen-compatible games. The GitHub importer supports reviewed licensed imports, but no third-party game has been added automatically in this version.

## Set up analytics

1. Keep `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as **server-only** environment variables in Netlify. Never place the service key in frontend JavaScript.
2. Run `supabase/anonymous-analytics.sql` in the existing Supabase project's SQL editor. This creates three aggregate tables and two RPCs.
3. Deploy to Netlify. `/.netlify/functions/arcade-event` stores aggregate launches/searches and `/.netlify/functions/arcade-stats` returns counts for the recommendations and rankings. If Supabase is not configured, games still launch, but real counts are shown as unavailable.
4. These are **game launches, not unique people**. The frontend locally suppresses repeated events in a short period without storing identity data. This is not a fraud-resistant unique-user measurement service.

## Play locally

Run `python -m http.server 8888` at repository root and open `http://localhost:8888/`. The full set of existing games requires the original repository files. Use an HTTP server rather than `file://`.

## Add an open-source game from GitHub

```bash
node tools/import-github-game.mjs owner/permissively-licensed-game --entry=index.html --name="My Game" --category=Puzzle
```

Importing creates a dedicated directory under `public/imagine/` and a catalog entry **only if** source/license/file checks pass. Review any absolute asset paths and the game behavior, then test and commit. Imported games are never automatically placed into a live deployment merely by supplying a URL.

## QA commands

```bash
node --check public/arcade-core.js
node --check public/arcade-next.js
node --check public/player-next.js
node --check netlify/functions/arcade-stats.js
node --check netlify/functions/arcade-event.js
node --test tests/analytics.test.cjs
python tests/test_static.py
```

A live browser test is still required before production approval. The current automated-test environment has administrator-controlled Chromium navigation restrictions; this does **not** prove actual rendered desktop/mobile quality or compatibility with every existing game.

## Preservation and limitations

This branch is based on the existing `main` git tree and does not rewrite or delete existing playable game assets. Old creator/account routes are intentionally retired in the new application. The source and Git history remain recoverable on `main` until the new branch is reviewed. Existing third-party game licensing and actual runtime compatibility must be audited separately; a file's presence alone doesn't prove it works or that redistribution is permitted.
