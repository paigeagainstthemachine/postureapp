# Posture Plan App: Product Brief

## What this is
A personal, single-user app to do and track a physical therapy style posture program. It has two jobs:

1. **Do:** a guided, interactive way to run each exercise session (timers, rep counters, rest, side switching, illustrated steps).
2. **Track:** log what was done, how it felt, and show progress over time.

One user (Paige), one phone, often used one-handed while holding a newborn, sometimes at night. Optimize for that.

## User context (design inputs)
- Desk worker, 31, hypermobile joints (diagnosed), rounded shoulders, forward head posture, upper back kyphosis, tight neck and traps, pain worse on the RIGHT side, headaches, right arm fatigues easily (shoveling, writing).
- 38 weeks pregnant as of 2026-11-25. The baby is due imminently. The program has two phases because what is safe and sensible changes at delivery.
- She is a senior product designer. She will have strong opinions about the UI. Propose a design direction early and let her react.
- Her dev setup: Claude Code, GitHub, GitHub Desktop, Vercel auto-deploys, MacBook Pro. Prior projects were HTML/CSS/JS.

## Phases (see `data/program.json`)
- **Phase 1: Now until delivery.** Daily ~10 min block of gentle exercises, pregnancy-safe positions only. Lacrosse ball Mon/Wed/Fri/Sun. Extra chin nod sessions 3x/day.
- **Phase 2: After clearance.** Starts when her provider clears exercise (commonly around 6 weeks postpartum). Mon/Wed/Fri strength day, Tue/Thu easy walk + chin nods, Sat optional walk, Sun rest. 8 to 12 week progression table.
- Phase is set manually: a "Start Phase 2" action with a date and a confirm step ("Has your provider cleared you to exercise?"). Never switch automatically.
- Provide a "pause" or "light day" option. Newborn life is unpredictable and the app must never guilt her.

## Core features

### 1. Today screen (home)
- Shows today's plan from the current phase and weekday, with progress (e.g. 4 of 7 done).
- Big primary button: "Start session".
- A quick "Chin nod" button that starts a single 10 x 5 sec set instantly and logs it (target 3 per day in Phase 1).
- Small daily check-in card (10 seconds): right neck/shoulder pain 0-10, headache none/mild/bad, right arm fatigue or tingling yes/no.
- "Newborn mode" toggle: bigger tap targets, fewer words, one-handed layout, dark theme for night.

### 2. Guided session player (the interactive part)
For each exercise in order:
- Illustration (`assets/figures/*.svg`), name, dose, 3 to 4 step cue list, the note, equipment checklist before starting.
- **Rep exercises:** a tap counter, or an optional auto-paced mode with a metronome-style tempo (e.g. 3-second lowering for rows, side-lying rotation).
- **Hold exercises (chin nods, bird dog):** an on-screen hold timer with audio and haptic cues (e.g. 10 reps x 5 sec holds, auto-advancing).
- **Lacrosse ball:** per-spot countdown (60 to 120 sec), with the spot name ("top of right shoulder", "between right blade and spine").
- **Rest timer** between sets (default 45 sec, adjustable).
- **Side handling:** for side-specific exercises, the app tells her which side (right is the priority; side-lying work is on her LEFT side in Phase 1) and walks through each side.
- Log per set: reps done, load used (band color or lb), and an "easy / right / hard" tag. Pre-fill from last time.
- Skip, swap, or stop-early options at any time. Stopping early still logs what she did.
- Stop-rule banner reachable at all times: stop and rest if dizzy, short of breath, sharp pain, or tingling or numbness in the arm.
- Screen should stay awake during a session (Wake Lock API). Works with sound off.

### 3. Progress
- **Adherence:** week view of planned vs done. Be kind: no streak shaming, no red failure states. Show "sessions this week" and gently celebrate.
- **Pain and symptom trend:** line chart of right neck/shoulder pain (0-10) over time, headache days, arm fatigue/tingling days. This is the real signal of progress.
- **Strength progression:** per exercise, load and reps over time. Highlight when the progression table says it is time to step up.
- **Phase 2 8-week grid:** mirrors the PDF checklist (one box per week, completes when 3 strength days are done).
- **PT summary export:** one printable page with the last 4 to 8 weeks of pain, headache, arm symptoms, and exercise adherence. She will bring this to a physical therapist. Include a clear list of symptoms worth mentioning (arm fatigue, tingling, headaches).

### 4. Library
- Browse all exercises with illustration, steps, cues, notes, equipment, which phase uses it.
- Equipment and shopping list view from `data/shopping-list.json` (tick off what she owns, show running total vs the $500 budget).
- Phase 1 ground rules and the late-pregnancy headache flag in plain, calm language.

### 5. Reminders (keep modest)
- Optional in-app "chin nod" nudge every 45 to 60 minutes during work hours (weekdays 10 AM to 5 PM) while the app is open or installed as a PWA. Do not promise reliable background notifications on iOS. Offer local notification permission as best-effort and degrade gracefully.
- A gentle daily reminder time setting.

## Data model (local-first)
Everything is stored on-device. No account, no backend. Export and import as JSON for backup.

```
Settings        { phase, phase2StartDate, newbornMode, reminderTime, nudgeInterval, unitPrefs }
Session         { id, date, phase, startedAt, endedAt, completed: boolean, notes }
SetLog          { id, sessionId, exerciseId, setIndex, side?, reps, holdSeconds?, load, effort: easy|right|hard, skipped }
CheckIn         { date, painRightNeckShoulder: 0-10, headache: none|mild|bad, armFatigueOrTingling: boolean, note }
OwnedEquipment  { itemId, owned: boolean }
```
Seed exercise and program definitions from `data/exercises.json` and `data/program.json`. Do not hardcode exercise content in components.

## Tech recommendation (change if there is a better idea)
- Vite + React + TypeScript, no backend.
- PWA (installable, offline) via `vite-plugin-pwa`.
- Storage: IndexedDB through Dexie. Add JSON export and import.
- Charts: small, hand-rolled SVG or a light library. Keep bundle small.
- Deploy to Vercel from GitHub (she already has this pipeline).
- Audio cues with the Web Audio API, haptics with `navigator.vibrate` where supported, Wake Lock API for sessions.
- Plain HTML/CSS/JS is acceptable if you can keep it clean. Ask her once if unsure.

## Design direction
- Calm, supportive, not gamified. The PDFs use teal (`#2F6F6B`) with orange (`#D9772B`) for equipment, light teal backgrounds. Treat that as a starting point, not a constraint.
- Large type, generous spacing, one primary action per screen. One-handed reach: primary buttons at the bottom.
- Dark theme that works at 3 AM.
- Illustrations are simple SVG stick figures. v1 uses them static. v2 idea: animate between a start pose and end pose. The figure source is in `reference/figure-source/figs.py`.
- Accessible: AA contrast, focus states, no color-only meaning, respects reduced motion.

## Copy and tone
- Direct, warm, short. No lecturing, no heavy medical hedging.
- No em dashes anywhere in UI copy or docs. Use commas, periods, or colons.
- Instructions should be copy-paste clear. Prefer concrete numbers (sets, reps, seconds).
- Safety copy is calm and specific, and shown once in the right place rather than repeated.

## Safety and content rules
- Phase 1 includes only pregnancy-safe positions. Exercises flagged `pregnancy_safe: false` in `exercises.json` (incline bench work, bird dog) must never appear in Phase 1.
- Do not give medical advice beyond what is in the data files. No diagnosis language. The app should show the stop rules and the symptom list for a PT.
- Do not auto-escalate or auto-diagnose from check-in data. It only shows trends and exports a summary.

## Out of scope for v1
Accounts, sync across devices, social features, video, wearable integrations, calorie tracking, AI chat inside the app.

## Milestones
1. Scaffold app, load data files, build Library and exercise detail screens.
2. Today screen and Phase 1 guided session player (timers, counters, rest, logging).
3. Check-in, history, and progress charts.
4. Phase 2 schedule, progression, and 8-week grid.
5. PWA install, offline, reminders, newborn mode, dark theme.
6. PT summary export, JSON backup and restore, polish.

## Definition of done for v1
She can open the installed app on her phone, tap Start session, get through a Phase 1 session one-handed with timers and counters, log how she felt, and see a pain trend and weekly adherence. The data survives closing the app. She can export a PT summary page.
