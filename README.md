# PipelineOS

A keyboard-first sales pipeline / CRM portfolio app for B2B SaaS teams. Part of the LBMA portfolio (`letsbuildmyapp.com`).

## Visual archetype

- **Archetype:** dense pro tool (Linear / Attio vibe)
- **Type:** Geist (sans) + Geist Mono
- **Palette:** slate / near-black with electric **cyan** (`#22d3ee`) accent
- **Radius:** `rounded-md` max (6px)
- **Density:** 13–14px row text in dense lists, `tabular-nums` everywhere numbers line up
- **Mode:** dark-first, full light mode

## Stack

React 18 + TypeScript + Vite, Tailwind, React Router v6, TanStack Query, Zustand (data + auth), react-hook-form, zod (forms), Framer Motion, lucide-react, sonner, cmdk, recharts, Firebase (config wired for emulators).

Demo persists to `localStorage` so it works as a static deploy. Firestore emulator config + seed script included for end-to-end demos.

## Run

```
npm install
npm run dev
```

Visit `http://localhost:5173`. App loads pre-seeded with 36 deals, 5 users, 16 companies, 22 contacts, 12 tasks, ~150 activities.

### Demo accounts (password: `demo1234`)

| Role    | Email                         |
|---------|-------------------------------|
| Admin   | admin@pipelineos.demo         |
| Manager | manager@pipelineos.demo       |
| Rep     | rep@pipelineos.demo           |
| Rep     | priya@pipelineos.demo         |
| Rep     | sam@pipelineos.demo           |

One-click sign-in tiles on the login screen.

## Firebase emulator (optional, for end-to-end Firestore demo)

```
firebase emulators:start --project demo-pipelineos --only auth,firestore,functions
node scripts/seed.mjs
```

Hosting emulator runs on **port 5050**.

## Features

- **Pipeline kanban** — drag deals between 7 stages (Lead -> Won/Lost) with cyan insertion-line indicator. Stage changes auto-log to activity.
- **Deals list** — sortable, searchable, filterable.
- **Deal detail** — activity timeline (notes/calls/emails/meetings), tasks, full details. Inline stage stepper.
- **Contacts** — companies & people, grouped, with deal value rollup.
- **Reports** — 6 charts (deals by stage, pipeline value, weighted forecast trend, source attribution, win-rate funnel, rep leaderboard). Manager + admin only.
- **Team** — rep leaderboard ranked by quota attainment with progress bars. Manager + admin only.
- **Admin** — invite/remove users, custom stages with editable probabilities, permission toggles, reseed.
- **Spotlight tour** — first-run, per-role-per-device. Storage key: `pipelineos:tutorial_seen:<role>`.
- **Cmd-K command palette** — search deals, navigate, quick actions.
- **Auth** — email + password, one-click demo tiles, mock Google.
- **Mobile-first** — drawer navigation, kanban scrolls horizontally on small screens.
- **Dark + light** — CSS vars, toggle in sidebar.
- **Designed 404 + 500.**
- **Custom confirm dialogs** — never `window.confirm`.

## Files of note

- `src/store/data.ts` — Zustand store with persist (single source of truth)
- `src/store/auth.ts` — mock auth wired to seeded users
- `src/data/seed.ts` — deterministic 36-deal demo dataset
- `src/pages/Pipeline.tsx` — kanban with HTML5 drag-and-drop + insertion indicator
- `src/components/Tutorial.tsx` — spotlight tour, per-role steps
- `src/components/CommandPalette.tsx` — Cmd-K palette
- `src/components/ConfirmDialog.tsx` — Promise-based confirm hook
- `firestore.rules` — first-class rules (no open writes)

## Built by

[letsbuildmyapp.com](https://letsbuildmyapp.com)
