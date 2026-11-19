# OEE Dashboard Demo

A simulated OEE (overall equipment effectiveness) dashboard for a fictional blister packaging line: **Linie 3 Demo** at **Northwind Pharma**. The UI is in German.

This is a simulation with made-up data. No values come from a real plant, and no real company, product, or line is represented.

Built with AI-assisted development (Vite, React, strict TypeScript, Recharts, Vitest).

## What v1 shows

The Übersicht page only:

- Four KPI rings: Verfügbarkeit, Leistung, Qualität, OEE, each with a delta vs. the start of the shift
- OEE over the Frühschicht (06:00-14:00)
- Stop reasons with duration and count
- Live plant status for Blistermaschine, Kartonierer, and Serialisierung
- A ticking simulation clock with Pause, 1x, 10x, 60x, and reset (1x = one simulated minute per real second)

Other tabs are placeholders marked "bald verfügbar".

## Run locally

```bash
npm ci
npm run dev        # http://localhost:5175
npm test           # leak guard, then Vitest
npm run typecheck
npm run build      # leak guard, then typecheck and Vite build
```

See [docs/LERNEN.md](docs/LERNEN.md) for a short walk-through of the ideas used in the code.
