# Dice Tray

A luxury 3D dice roller for tabletop RPGs. Roll any standard polyhedral
(d4 · d6 · d8 · d10 · d12 · d20 · d100) with real physics, crit effects,
and a beautiful velvet-and-gold aesthetic.

![preview](public/dice.svg)

## Features

- **Real 3D physics** with [Rapier](https://rapier.rs/) — dice tumble,
  collide, and settle naturally.
- **Cryptographically-secure outcomes** with `crypto.getRandomValues()` and
  rejection sampling — zero modulo bias. The settled face of each physics
  die is mapped onto a cryptographically random outcome before the throw,
  so the dice you see ARE the result.
- **All standard dice** — d4, d6, d8, d10, d12, d20, d100 (rolled as two
  d10s: tens + ones).
- **Polished sound design** — Web Audio synthesis, no audio files.
- **Crit / fumble effects** — confetti burst for natural max, red glow
  for natural min.
- **Roll history & stats** — persisted in IndexedDB, with a distribution
  chart and per-die statistics.
- **Modifier and quantity** — roll up to 12 dice with a ±20 modifier.
- **Keyboard shortcuts** — `Space` to roll, `Esc` to clear.

## Tech

React · TypeScript · Vite · Three.js · React Three Fiber · Drei · Rapier ·
Zustand · Framer Motion · Tailwind v4 · Recharts · idb · Web Audio API.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Deploy to Vercel

Just connect this repo on [vercel.com](https://vercel.com) — `vercel.json`
sets up the SPA rewrite and the Vite framework preset. No env vars
required.

## Architecture notes

- **`src/lib/random.ts`** — `secureRandomInt(min, max)` with rejection
  sampling. Used everywhere; `Math.random` is never called.
- **`src/lib/dice-geometry.ts`** — analytic mesh + face data for each
  Platonic die plus the d10 pentagonal trapezohedron.
  `readDieResult()` reads the settled face from the rigid body quaternion
  (top face for d4/…/d20, bottom face for d4).
- **`src/three/Die.tsx`** — per-die rigid body. On mount, applies an
  initial impulse and angular impulse derived from
  `secureRandomFloat()` so the in-air motion is cryptographically random
  too; result is then determined by the physics simulation, not preset.
- **`src/store/useDiceStore.ts`** — Zustand store, phase machine:
  `idle → throwing → settling → revealed`.
- **`src/lib/audio.ts`** — pure Web Audio synthesis: click, whoosh,
  impact, reveal, critSuccess arpeggio (C5–E5–G5–C6), critFail.
- **`src/lib/history-db.ts`** — IndexedDB-backed history with `by-time`
  index, capped at 500 rows on read.

## License

MIT
