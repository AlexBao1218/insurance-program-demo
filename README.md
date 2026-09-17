# Insurance Programme Demo

A portfolio demo of an internal insurance-programme management app, originally built for a corporate administration team on **Feishu Spark (妙搭)**, Feishu's low-code full-stack platform. It gives programme managers one place to see the portfolio (classes of cover, policies, claims), track loss ratios and renewals, export a report, and ask an AI assistant questions about the data. This public version is a standalone static SPA: **no company is named** (the programme is simply "Internal Insurance Program"), **aggregate figures are synthetic and labelled as such**, **record-level fields are redacted**, and **AI and Feishu-only features show an explicit "Not available in public demo" state** rather than a fake substitute. The original production setup is described at the bottom and in [`docs/case-study.md`](docs/case-study.md).

See [PROJECT.md](PROJECT.md) for the owner handbook and the rules AI agents must follow when editing this repo.

## Screenshots

<!-- TODO: add screenshots
![Dashboard](docs/screenshots/dashboard.png)
![Data management](docs/screenshots/data.png)
![AI assistant](docs/screenshots/assistant.png)
-->

## What's real vs simulated

| Feature | Status | Notes |
|---|---|---|
| Dashboard analytics, charts, loss-ratio | **Real logic** | Computed at runtime from the bundled dataset; aggregates are synthetic and carry a "Synthetic data" label |
| Data management / class detail views | **Real logic** | Filtering, grouping and drill-down over the same dataset |
| Record-level fields (policy numbers, insurers, claimants, claim numbers, descriptions, locations, PDF names, remarks) | Redacted | Stored as a sentinel and shown as grey "Redacted for public demo" bars |
| Brokers | Redacted | names withheld; the broker chart keeps slices and shares without labels |
| DOCX report export | **Real** | Generated in the browser with `docx` |
| AI report narrative | Canned | Fixed text marked as simulated; tables are rebuilt from the dashboard snapshot |
| AI assistant | Visual replica | Reproduces the embedded Aily panel; any message gets a "Not available in public demo" notice, no live answers |
| Bitable deep links / sync | Disabled | Shown with an explicit "Not available in public demo" label |
| Feishu doc export | Unavailable | Required the Feishu runtime; explicit toast |

## Tech stack

- React 19 + TypeScript, Vite
- Tailwind CSS v4, shadcn/ui (Radix), lucide-react
- react-router-dom v7
- ECharts (`echarts-for-react`) and Recharts
- `docx` for report export
- Deployed on Vercel as a static SPA (`vercel.json` rewrites all routes to `index.html`)

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to ./dist
```

Also available: `npm run typecheck` and `npm run lint`.

## Project layout

```
client/
├── index.html
└── src/
    ├── index.tsx            # entry: BrowserRouter + error boundary
    ├── app.tsx              # route table
    ├── components/          # shared components (Layout, Header, DemoFooter, ...)
    │   └── ui/              # shadcn/ui components
    ├── pages/<PageName>/    # one directory per page, entry file named after it
    ├── hooks/
    ├── lib/                 # utilities, analytics, brand constants
    ├── data/                # bundled dataset (synthetic aggregates, redacted record fields)
    ├── platform/            # shim replacing the former Feishu Spark runtime
    └── tailwind-theme.css   # theme tokens (bg-background, text-muted-foreground, ...)
shared/                      # types + static assets shared with the former backend
server/capabilities/         # JSON descriptors of the original capability plugins (docs only)
```

Import aliases: `@/` → `client/src`, `@shared/` → `shared`.

## Original architecture

In production the app ran inside Feishu:

1. **React SPA hosted in Feishu Spark.** Same front end as here, with the platform's client toolkit providing auth, the current user's profile, scoped storage and links.
2. **Capability plugins reading three Bitable tables** — `Insurance_Class`, `Policy_Master` and `Claims_Master` — the system of record maintained by the administration team.
3. **localStorage cache with schema/version guards.** Table data was cached client-side and invalidated whenever the schema or dataset version changed, so the dashboard opened instantly and only re-synced when needed.
4. **NestJS backend proxying a Feishu Aily skill** that turned the computed portfolio metrics into a narrative for the exported report.
5. **Aily web SDK agent embedded** in the assistant page for natural-language Q&A over the same data.

This repo keeps the front end and replaces every platform dependency with a local shim (`client/src/platform/index.tsx`); the Bitable readers fall back to the bundled dataset and the AI paths show an explicit "Not available in public demo" state. For the design decisions and lessons learned, see [`docs/case-study.md`](docs/case-study.md).
