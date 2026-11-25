# Posture Plan

A personal, local-first app for doing and tracking a posture exercise program. It guides each session (timers, rep counter, rest, sides), logs how it went, and shows progress over time. Everything stays on the phone: no account, no backend.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173 and make the window phone width.

To try the production build, including offline:

```bash
npm run build
npm run preview
```

## Deploy

Pushes to `main` on GitHub deploy to Vercel automatically. Vercel detects Vite, so there are no settings to change. `vercel.json` stops the service worker file from being cached, so installed copies pick up updates.

On iPhone: open the site in Safari, tap Share, then Add to Home Screen. Open it once while online, and after that it works offline.

## Where things live

```
data/                  program content: exercises, phases, schedules, shopping list
src/data/              typed loaders for data/ and the dose formatter
src/lib/plan.ts        what a day needs: plans, Phase 2 weeks, progression
src/db/                on-device storage (IndexedDB through Dexie)
src/figures/           exercise figures: start and end poses, and the renderer
src/screens/           Today, Session, Progress, Library, Settings, PT summary
src/components/        shared pieces: check-in, pain chart, 8 week grid, figure
public/icons/          app icon
reference/             the original PDFs and figure source, for reference only
assets/figures/        the original static drawings, for reference only
```

Program content comes only from `data/`. Change a dose or a step there, not in the components.

## Rules the app keeps

- Phase 1 never shows an exercise marked `pregnancy_safe: false`.
- Phase changes are manual, with a confirmation.
- No streaks, no red failure states, no medical interpretation of check-ins.
- No em dashes in copy.

## Your data

Data lives in the browser's storage on this device. Use Settings, then Save backup, now and then. Restore replaces what is on the device with the backup, after a confirmation.
