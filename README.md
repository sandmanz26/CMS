# SalesHub — Sales CMS

Front-end only admin console for sales teams, built with React, Vite, Tailwind CSS v4 and shadcn/ui. All data is mock data kept in memory (it resets on refresh).

## Features

- **Leads** — owner, A–D quality grade (engagement + ICP fit), follow-up SLA, last visit / meeting / follow-up / call
- **Lead handover** — reassign with a required reason, ownership history, owner suggestion by territory
- **Territories** — schematic map of Indonesia with coverage per area
- **Pipeline checkpoints** — exit criteria per stage, manager override with a logged reason
- **Revenue targets** — per-rep targets with pace, projection and gap; commission estimate
- **Materials** — versioned sales collateral with review flow, expiry and must-read tracking
- Invoices, payment terms, approvals, analytics, sales division health, team, data access, settings
- macOS-style dock navigation with a Launchpad, light/dark theme, responsive from 320px

## Run locally

```bash
cd app
npm install
npm run dev
```

## Structure

- `app/` — the web app (`src/pages`, `src/components`, `src/data` for mock data and business rules)
- `dribbble/` — cover, flow diagrams, screenshots and content plan for Dribbble
