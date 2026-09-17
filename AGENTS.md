# Agent notes

This repository is a **standalone Vite + React 19 + TypeScript SPA** (Tailwind CSS v4, shadcn/ui, react-router). It was exported from Feishu Spark (妙搭) and no longer depends on that platform at runtime.

## Run

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # static output in ./dist
npm run typecheck  # tsc -p tsconfig.app.json --noEmit
npm run lint       # eslint client/src
```

## Layout

- `client/` — the app (`client/src/app.tsx` holds the routes; `client/index.html` is the entry).
- `shared/` — types and static data shared with the former backend.
- `server/capabilities/` — JSON descriptors of the original Feishu capability plugins, kept for documentation only. There is no server.
- `client/src/platform/index.tsx` — a local shim that replaces the former Feishu Spark runtime (`@lark-apaas/client-toolkit`). `vite.config.ts` and `tsconfig.app.json` alias the package name to this file, so imports of `@lark-apaas/client-toolkit` resolve here.

## Conventions

- Naming and disclosure constants come from `client/src/lib/brand.ts` (`PROGRAM_NAME`, `REPORT_TITLE`, `REDACTED`, `REDACTED_LABEL`, `NOT_AVAILABLE_LABEL`, `SYNTHETIC_LABEL`). There is no company name anywhere in the repo, real or fictional; never add one.
- Public-demo data policy: aggregate numbers are synthetic and labelled "Synthetic data"; record-level fields (policy numbers, insurer names, claimants, claim numbers, descriptions, locations, PDF names, remarks) are stored as the `REDACTED` sentinel and rendered as a grey "Redacted for public demo" bar; brokers are generic "Broker A–D / Others"; project-specific classes are "Project policy 01…". Never invent substitute names or values.
- Bitable sync, deep links, Feishu Docs export and live AI are not available; show `NOT_AVAILABLE_LABEL` rather than a fake result. The AI assistant page is a visual replica of the Aily panel and must never fabricate an answer.
- Deployed to Vercel as a static SPA (`vercel.json` rewrites everything to `index.html`).
