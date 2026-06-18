# Mantle Distribution Friction Agent

Track 2 research agent for the Mantle Research Challenge. It scores RWA (real-world asset) distribution health and compliance friction for Mantle assets using live data from CoinGecko and DefiLlama.

## Architecture

Fullstack TypeScript app:

- **Backend** — Node.js HTTP server (`server/index.ts`) exposing a small JSON API (`/api/assets`, `/api/score/:assetId`). Scoring logic lives in `src/`. Listens on port 3000 in development.
- **Frontend** — React 19 + Vite + Tailwind CSS v4 (`web/`). Runs on port 5000 and proxies `/api` to the backend.
- **CLI** — `scripts/score.ts` (`npm run score`) prints a report to the terminal.

## Development

A single workflow (`Start application`) runs `npm run dev`, which uses `concurrently` to start both the API server and the Vite dev server. The frontend is served on port 5000 (the Replit preview port) with `allowedHosts` enabled so the proxied preview works.

## Production / Deployment

- Target: **autoscale**
- Build: `npm run build` (Vite builds the frontend to `dist/`)
- Run: `NODE_ENV=production PORT=5000 tsx server/index.ts` — in production the same Node server serves the static `dist/` build and the API on port 5000.

## Notes

- The `shell-quote` dependency is pinned via an `overrides` entry in `package.json` to satisfy the package security firewall.
- The Windows-only `@rollup/rollup-win32-x64-msvc` dependency was removed; Rollup auto-selects the correct platform binary on Linux.

## User preferences

(none recorded yet)
