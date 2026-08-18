# Olympus — Game Data Layer + Tactical Battle Engine

The core Olympus game, built **on top of the existing `olympus` agent base**
(`../skills/*` — the seven `olympus-*` agent archetypes). It turns Greek gods
into Socionics-typed factions, wraps the Olympus-skills as callable AI hooks,
and **adapts the quadra-tactics battle-engine + zero-rts grid** into a runnable
tactical simulation (task `t_cc2082ec`).

## What this is

- **Gods as data** — `src/data/gods.ts` is a 16-row registry (one row per god).
  Adding a god = adding one row; mechanics never change.
- **Factions** — `src/data/factions.ts` defines the 7 base factions (4 quadra
  factions + 3 cross-god "pantheon meta" factions grouping gods by their
  Olympus-Skill role). Instantiate with `createFaction(id)`.
- **Relation engine** — `src/engine/relations.ts` resolves intertype relations
  (conflict / duality / activation / extinguishment / mirror / cross-quadra)
  into numeric alliance & war modifiers, and encodes the RPS ring
  Γ > Δ > Α > Β > Γ.
- **AI scaffolding** — `src/ai/agents.ts` wraps each god's Olympus-Skill as a
  callable `SkillHook` (the four named brief roles Orchestrator / Tactician /
  Diplomat / Economist plus the full 16).

### Battle engine (adaptive reuse, per reusability audit `t_57fe1306`)

`src/engine/battle/` integrates the two upstream projects:

- **`grid.ts`** — square-cell board with A* pathfinding (reused concepts from
  quadra-tactics `squaregrid.ts` + zero-rts `grid.ts`).
- **`markov.ts`** — per-quadra Markov stance engine (generalized from
  quadra-tactics' 3-state / 2-matrix model to 4 quadra matrices).
- **`combat.ts`** — Evade → Crit → Damage pipeline with RPS resonance + war
  sphere bonus layered on top (adapted from quadra-tactics `combat.ts`).
- **`skills.ts`** — the 16 god signature skills (cooldown-gated, data-as-design).
- **`stats.ts`** — god combat stats derived from their Socionics axes.
- **`alliance.ts`** — relation-driven alliance state machine between factions.
- **`battle.ts`** — the `Battle` class: factions as sides, per-unit skill-driven
  AI (wires the Olympus-skill hooks), RTS-pause `step()` loop, win detection.

The `Battle` is deterministic given a seed and exposes `snapshot()` for a future
zero-rts renderer / Net layer — the layered architecture is preserved.

## Public API

```ts
// Data + relations
import {
  getGod, createFaction, relationBetween,
  allianceModifier, warSphereBonus, assignBehavior,
  OLYMPIAN_REGISTRY, FACTION_REGISTRY,
} from './src/index.js';

// Battle engine
import {
  Battle, Grid, resolveAttack, buildAllianceMap, canAttack, SKILLS,
} from './src/index.js';

const zeus = getGod('zeus');
const warhost = createFaction('warhost');              // instantiates 4 gods
const rel = relationBetween(zeus, getGod('hera'));     // 'activation'
const bonus = warSphereBonus(zeus, getGod('athena'));  // -0.15 (BETA<DELTA)

// Run a deterministic tactical match between two+ factions:
const b = new Battle([createFaction('warhost'), createFaction('underworld-syndicate')],
                     { cols: 12, rows: 12, seed: 0x1234 });
const winner = b.run();                                 // 'warhost' | 'underworld-syndicate' | null
```

Headless runnable demo: `npx tsx src/sim.ts warhost underworld-syndicate`.

## Run

```bash
npm install          # installs vitest + typescript (or reuse an existing install)
npm run typecheck    # tsc --noEmit (strict, noUnusedLocals/Parameters)
npm test             # vitest run — data layer (19) + battle engine (17) = 36 tests
npx tsx src/sim.ts   # headless battle between two factions (any 2+ faction ids)
```

> On a machine that already has `vitest`/`typescript` (e.g. the sibling
> `quadra-tactics` repo), you can point the binaries at this folder without a
> fresh `npm install`. `tsx` is bundled with vitest for the headless demo.

## Acceptance status (task `t_cc2082ec`)

- [x] Battle-engine grid adapted (square cells + A*), reused from quadra-tactics /
      zero-rts grid concepts.
- [x] Generic quadras replaced by god factions; Olympus-skill AI agents wired
      into turn / RTS-pause decision making (each unit's god skill role drives
      MOVE / ATTACK / CAST decisions).
- [x] Relation-based alliance mechanics from intertype relations implemented
      (`alliance.ts` state machine; `canAttack` gates targeting).
- [x] Runnable simulation: two+ god factions engage using skill-driven AI and
      alliances; headless output confirms correct behavior.
- [x] zero-rts layered architecture considered (deterministic `Battle.step()`
      + `snapshot()` ready for a future renderer / Net layer); MVP is tactical.
- [x] `tsc --noEmit` strict → 0 errors; vitest run → 36 passed.
