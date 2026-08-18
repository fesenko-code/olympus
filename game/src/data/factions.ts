/**
 * Base faction definitions — the 7 Olympus factions.
 *
 * Four are the canonical quadra factions (one per quadra, the 16-god MVP),
 * and three are cross-god "pantheon meta" factions that group gods by their
 * Olympus-Skill role (brief-named core roles + the infra/guardian roles).
 * Every faction is pure data; instantiate with `createFaction` (see index).
 */

import type { Faction, FactionArchetype, OlympianGod, OlympusSkill, Quadra } from '../types.js';
import { ALL_GODS, OLYMPIAN_REGISTRY } from './gods.js';

export interface FactionDef {
  id: string;
  name: string;
  quadra: Quadra | null; // null for meta (cross-quadra) factions
  archetype: FactionArchetype | 'PantheonMeta';
  /** Member god ids that make up this faction. */
  members: string[];
  /** Short description of the faction's in-game identity. */
  blurb: string;
}

/**
 * The 7 base factions.
 *   - 4 quadra factions: EnlightenmentCourt / Warhost / UnderworldSyndicate / Craftwardens
 *   - 3 meta factions grouping gods by their Olympus-Skill role:
 *       Strategists (Orchestrator/Tactician), Diplomats (Diplomacy/Status),
 *       Economists (Economy/Forge/Order/Sustain)
 */
export const FACTION_DEFS: readonly FactionDef[] = Object.freeze([
  {
    id: 'enlightenment-court',
    name: 'The Enlightenment Court',
    quadra: 'ALPHA',
    archetype: 'EnlightenmentCourt',
    members: ['apollo', 'dionysus', 'hermes', 'hestia'],
    blurb: 'Science, trade and revelry. Knowledge as power.',
  },
  {
    id: 'warhost',
    name: 'The Warhost',
    quadra: 'BETA',
    archetype: 'Warhost',
    members: ['zeus', 'ares', 'hera', 'persephone'],
    blurb: 'Conquest, order and status. Force as doctrine.',
  },
  {
    id: 'underworld-syndicate',
    name: 'The Underworld Syndicate',
    quadra: 'GAMMA',
    archetype: 'UnderworldSyndicate',
    members: ['hades', 'poseidon', 'aphrodite', 'prometheus'],
    blurb: 'Economy, ambition and the long game. Hoard to tip the board.',
  },
  {
    id: 'craftwardens',
    name: 'The Craftwardens',
    quadra: 'DELTA',
    archetype: 'Craftwardens',
    members: ['athena', 'hephaestus', 'artemis', 'demeter'],
    blurb: 'Defense, craft and duty. Quality over haste.',
  },
  {
    id: 'strategists',
    name: 'The Strategists',
    quadra: null,
    archetype: 'PantheonMeta',
    members: ['zeus', 'athena'],
    blurb: 'Orchestrator + Tactician. Macro and micro command.',
  },
  {
    id: 'diplomats',
    name: 'The Diplomats',
    quadra: null,
    archetype: 'PantheonMeta',
    members: ['hermes', 'hera'],
    blurb: 'Diplomacy + Status. Broker and enforce the pact.',
  },
  {
    id: 'economists',
    name: 'The Economists',
    quadra: null,
    archetype: 'PantheonMeta',
    members: ['hades', 'hephaestus', 'apollo', 'demeter'],
    blurb: 'Economy + Forge + Order + Sustain. The production engine.',
  },
]);

/** Faction definitions keyed by id. */
export const FACTION_REGISTRY: Record<string, FactionDef> = Object.freeze(
  FACTION_DEFS.reduce<Record<string, FactionDef>>((acc, def) => {
    acc[def.id] = def;
    return acc;
  }, {}),
);

/** Group all 16 gods by their base faction id. */
export function groupGodsByFaction(): Record<string, OlympianGod[]> {
  const out: Record<string, OlympianGod[]> = {};
  for (const def of FACTION_DEFS) {
    out[def.id] = def.members
      .map((id) => OLYMPIAN_REGISTRY[id])
      .filter((g): g is OlympianGod => Boolean(g));
  }
  return out;
}

/** Build a live Faction instance from a definition (resolves its member gods). */
export function buildFaction(def: FactionDef): Faction {
  const gods = def.members
    .map((id) => OLYMPIAN_REGISTRY[id])
    .filter((g): g is OlympianGod => Boolean(g));
  return {
    id: def.id,
    name: def.name,
    quadra: def.quadra ?? 'ALPHA', // meta factions adopt a neutral quadra for typing
    archetype:
      def.archetype === 'PantheonMeta'
        ? 'EnlightenmentCourt'
        : (def.archetype as FactionArchetype),
    gods,
  };
}

/** Which god ids expose a given Olympus-Skill role. */
export function godsWithSkill(skill: OlympusSkill): OlympianGod[] {
  return ALL_GODS.filter((g) => g.olympusSkill === skill);
}
