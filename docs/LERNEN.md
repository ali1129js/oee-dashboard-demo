# Learning notes

Short explanations of the ideas this project actually uses, and why they matter. Each one points at a file.

## OEE math, and why it multiplies

OEE is not an average. It is three ratios multiplied together:

- Verfügbarkeit = run time / planned time
- Leistung = (ideal cycle time × units produced) / run time
- Qualität = good units / total units
- OEE = Verfügbarkeit × Leistung × Qualität

A line that scores 90% on each factor has 73% OEE, not 90%. That is the point of the metric: a weakness in any one factor pulls the whole number down. All four values are kept in the range 0 to 1 and then shown as percentages.

See `src/lib/oee.ts` and the worked examples in `src/lib/oee.test.ts`.

## Pure functions, and why they make testing easy

`berechneKennzahlen` and `snapshotAt` take data in and return data out. They do not read the clock, the DOM, or `Math.random()`. So a test can pass known numbers and assert the exact result, including awkward cases such as "no run time" or "zero units", without rendering a page.

See `src/lib/oee.ts` and `src/lib/simulation.ts`.

## Seeded randomness

A normal call to `Math.random()` would make every test run produce a different shift, so assertions would flake. A seeded generator (Mulberry32 in `src/lib/rng.ts`) returns the same sequence when you give it the same seed. The dashboard always uses seed `2026_11_19`, so the demo looks the same each time you open it. Change the seed in a test and the plan changes too.

See `createRng` in `src/lib/rng.ts` and `buildShiftPlan` in `src/lib/simulation.ts`.

## React state vs derived data

Only a few things need to be state: the simulated clock, the speed, and the theme. Everything else (KPIs, the chart series, stop totals, station status) is derived with `useMemo(() => snapshotAt(plan, nowMin), [plan, nowMin])`. That keeps a single source of truth. If you stored the same OEE both as state and as a calculation, the two copies would drift.

See `src/pages/Uebersicht.tsx` and `src/hooks/useSimulationClock.ts`.

## useEffect intervals and cleanup

Live mode uses `setInterval` to advance simulated time. The effect starts the interval only when speed is not Pause, and the function it returns calls `clearInterval`. That cleanup runs when the speed changes, when the component unmounts, or when React re-runs the effect. Without it, old intervals keep ticking and the clock jumps or runs after you leave the page.

See `src/hooks/useSimulationClock.ts`.

## Recharts basics

The line chart and the horizontal bar chart are ordinary React components from Recharts. You pass an array of objects (`data`), name the keys (`dataKey="oee"`), and wrap the chart in `ResponsiveContainer` so it follows the card width. Animation is turned off so screenshots and `prefers-reduced-motion` stay calm. Colours come from the active theme, not from hard-coded CSS inside the chart.

See `src/components/OeeChart.tsx` and `src/components/Stillstandsgruende.tsx`.

## Strict TypeScript types for the domain model

Station ids, stop reasons, and plant statuses are string-literal unions (`"laeuft" | "warnung" | "steht"`), not open-ended strings. The compiler then catches a typo such as `"running"` before a test or a browser does. The snapshot type describes exactly what the page is allowed to show, which keeps the UI and the engine in agreement.

See `src/lib/types.ts`.
