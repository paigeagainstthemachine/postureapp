// Makes dark-theme copies of the exercise figures.
// Reads assets/figures/*.svg, swaps the palette from figs.py for the app palette,
// and writes assets/figures/dark/*.svg. Originals stay untouched.
// Run: node scripts/make-dark-figures.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const src = 'assets/figures'
const out = join(src, 'dark')

// figs.py color -> app color
const map = {
  '#2B2B2B': '#EDEBE6', // DARK: body lines -> off-white
  '#2F6F6B': '#E8402F', // TEAL: movement arrows -> signal red
  '#D9772B': '#E8402F', // ORANGE: equipment -> signal red
  '#A9B4B3': '#6E6C67', // GHOST: start pose -> dim grey
  '#EEF4F3': '#1A1A1A', // BG: card -> panel
  '#8A9695': '#55534F', // FLOOR: floor and wall -> dark grey
}

const hex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.round((parseFloat(v) / 100) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()

mkdirSync(out, { recursive: true })
const unknown = new Set()
for (const file of readdirSync(src).filter((f) => f.endsWith('.svg'))) {
  const svg = readFileSync(join(src, file), 'utf8')
    // Drop the light card behind each figure so the app's grid shows through.
    .replace(/fill="rgb\(93\.331909%, 95\.684814%, 95\.292664%\)"/g, 'fill="none"')
    .replace(
    /rgb\(([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\)/g,
    (m, r, g, b) => {
      const h = hex(r, g, b)
      if (!map[h]) unknown.add(h)
      return map[h] ?? m
    },
  )
  writeFileSync(join(out, file), svg)
}
if (unknown.size) console.warn('Colors with no mapping:', [...unknown].join(', '))
console.log('Wrote dark figures to', out)
