# CLAUDE.md

Project: Posture Plan App, a personal, local-first PWA for guiding and tracking a posture exercise program.

Read `PRODUCT_BRIEF.md` first. It is the source of truth for features, data model, tone, and safety rules.

## Source data (do not hardcode content in components)
- `data/exercises.json`: every exercise with steps, cues, notes, equipment, per-phase prescription (`rx`), figure path, and `pregnancy_safe` flag.
- `data/program.json`: phases, ground rules, weekly schedules, Phase 2 progression table.
- `data/shopping-list.json`: equipment list with approximate prices and links.
- `assets/figures/`: SVG and PNG exercise illustrations (one per exercise id). Use the SVGs.
- `reference/pdfs/`: the original printable plans, for reference only.
- `reference/figure-source/`: Python source for the illustrations if they need tweaking.

## Working style
- Start by proposing the stack and a short plan, then build milestone 1 from the brief. Ship small, working increments.
- Prefer boring, well-known tools. Keep dependencies minimal and explain any non-obvious one.
- Local-first: no backend, no accounts. Persist to IndexedDB. Provide JSON export and import.
- Commit in small steps with clear messages. The repo deploys to Vercel from GitHub.
- Run the app and check it in a browser at phone width (390 px) before saying a screen is done. Test the session player timers for real.
- Test offline behavior and install as a PWA before calling it finished.

## Rules that matter
- Never show `pregnancy_safe: false` exercises in Phase 1.
- Phase changes are manual with a confirmation. Never switch automatically.
- No streak shaming or failure framing in the UI.
- No em dashes in UI copy, comments, or docs.
- UI must work one-handed on a phone, with a dark theme.
- Accessibility: AA contrast, focus states, reduced motion, no color-only meaning.
- No medical advice beyond what is in the data files. No auto-diagnosis from check-in data.

## Ask before
- Adding a backend, analytics, or any third-party service.
- Changing exercise content or dosing in the data files (propose edits instead).
- Anything that sends data off the device.
