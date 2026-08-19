# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Arcade Vault ("una plataforma para jugar online y competir por la mayor cantidad de puntos") is a Next.js
16 app (App Router, React 19, Tailwind CSS 4) currently at the `create-next-app` starting point —
`app/page.tsx` and `app/layout.tsx` are still boilerplate.

**`references/templates/`** holds a standalone HTML/React prototype (`Arcade Vault.html` + `styles.css` +
`.jsx` files loaded via in-browser Babel, no build step) that is the design/product reference for the real
app. It is not part of the Next.js build. Use it to understand the intended screens, copy (Spanish UI),
and mock data model, not as code to import directly:

- `app.jsx` — root component; hand-rolled router using `location.hash` (JSON-encoded route object) and a
  `av_user` / `av_scores` localStorage-backed auth/score store. Routes: `biblioteca`, `detalle`, `player`,
  `auth`, `salon`.
- `data.jsx` — mock `GAMES` catalog and a seeded pseudo-random `seededScores()` generator used for
  leaderboards.
- `biblioteca.jsx` (game library grid), `detalle.jsx` (game detail + leaderboard), `reproductor.jsx` (the
  game player screen — simulated score ticking), `salon.jsx` (Salón de la Fama / hall of fame), `auth.jsx`
  (sign in/up), `nav.jsx` (nav bar).

When implementing real screens, treat these files as the UX/content spec (routes, fields, states) to port
into proper App Router pages/components, not as production code.

## Commands

- `npm run dev` — start the dev server (Turbopack, per Next.js 16 default).
- `npm run build` — production build.
- `npm run start` — run the production build.
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`
  core-web-vitals + typescript). No test runner is configured yet.

## Workflow

The README indicates this project follows spec-driven development using the `/spec` and `/spec-impl`
skills from `Klerith/fernando-skills` (installed via `npx skills@latest add Klerith/fernando-skills`).
Prefer that workflow — write/consult a spec before implementing a feature — if those skills are present.

## Notes specific to this Next.js version

Per `AGENTS.md` (auto-maintained by `next dev`): this Next.js version has breaking changes from what you
may expect from training data. Before writing routing/data/config code, check the relevant guide under
`node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`).
