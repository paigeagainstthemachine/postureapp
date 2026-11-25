# Posture Plan App: Claude Code Bundle

This folder has everything Claude Code needs to build your exercise tracking app.

## What is inside
```
README.md                 this file, with the starter prompt
CLAUDE.md                 project instructions Claude Code reads automatically
PRODUCT_BRIEF.md          full product spec: features, data model, design, milestones
data/
  exercises.json          12 exercises with steps, cues, dosing per phase, safety flags
  program.json            phases, weekly schedules, Phase 2 progression
  shopping-list.json      equipment, prices, links
assets/figures/           12 exercise illustrations (SVG and 400 dpi PNG)
reference/
  pdfs/                   the three printable PDFs (Phase 1, Phase 2, shopping list)
  figure-source/          Python source for the illustrations
```

## How to use it
1. Unzip and put this folder somewhere you keep projects.
2. Create a new GitHub repo, or run `git init` in this folder, so Vercel can deploy it later.
3. Open the folder in Claude Code (`cd` into it and run `claude`).
4. Paste the starter prompt below.

## Starter prompt (copy and paste)
```
Read CLAUDE.md and PRODUCT_BRIEF.md in this folder, then look at the files in data/ and assets/figures/.

I want you to build the Posture Plan App described in the brief. Before writing code, give me a short plan: the stack you recommend (I use Vercel and GitHub, and I have built plain HTML/CSS/JS apps before), the folder structure, and what you will build for milestone 1. Then build milestone 1 and run it so I can see it at phone width.

I am a product designer, so before you style anything, show me one proposed visual direction (colors, type, a sketch of the Today screen and the session player) and wait for my reaction.

Keep going milestone by milestone. At the end of each one, tell me what works, how to try it, and what is next. Ask me before changing any exercise content or doses.
```

## Tips
- The app is for one person and stores data on the device. Install it to your home screen after deploying, and use the JSON export now and then as a backup.
- Start with Phase 1 only. Phase 2 unlocks later through a manual "Start Phase 2" action, once your provider clears you to exercise.
- Prices in the shopping list are approximate as of 2026-11-25.
