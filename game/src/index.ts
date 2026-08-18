/**
 * Olympus game — public API.
 *
 * The single import surface other modules use to instantiate factions, look up
 * gods, resolve intertype relations, and assign skill-driven AI behavior.
 *
 *   import {
 *     getGod, createFaction, relationBetween, allianceModifier, warSphereBonus,
 *     assignBehavior, OLYMPIAN_REGISTRY, FACTION_REGISTRY,
 *   } from 'olympus/game';
 */

import type { Faction, OlympianGod } from './types.js';
import { ALL_GODS, OLYMPIAN_REGISTRY } from './data/gods.js';
import { buildFaction, FACTION_REGISTRY } from './data/factions.js';

export * from './types.js';
export { ALL_GODS, OLYMPIAN_REGISTRY } from './data/gods.js';
export {
  FACTION_DEFS,
  FACTION_REGISTRY,
  groupGodsByFaction,
  buildFaction,
} from './data/factions.js';
export {
  allianceBias,
  allianceModifier,
  beatsQuadra,
  QUADRA_BEATS,
  relationBetween,
  RELATION_LABELS,
  warSphereBonus,
} from './engine/relations.js';
export { assignBehavior, createSkillHook } from './ai/agents.js';

// ── Battle engine (adaptive reuse of quadra-tactics + zero-rts, per audit) ──
export {
  Battle,
  Grid,
  squareDistance,
  sameCell,
  cellsInRange,
  SQUARE_DIRS,
  makeRng,
  allianceBiasBetween,
  type Unit,
  type Side,
  type BattleLogEntry,
  type ArenaConfig,
} from './engine/battle/battle.js';
export {
  resolveAttack,
  resonanceEffect,
  type UnitStats,
  type AttackContext,
  type AttackResult,
  type ResonanceEffect,
} from './engine/battle/combat.js';
export {
  nextState,
  sampleState,
  matrixFor,
  initialStateFor,
  ALPHA_MATRIX,
  BETA_MATRIX,
  GAMMA_MATRIX,
  DELTA_MATRIX,
  type BattleStance,
  type MarkovEvent,
  type MarkovMatrix,
} from './engine/battle/markov.js';
export { SKILLS, type SkillDef, type SkillKind, type SkillTarget, type SkillStatus } from './engine/battle/skills.js';
export { deriveStats, deriveMaxHp } from './engine/battle/stats.js';
export {
  buildAllianceMap,
  stepStatus,
  factionBias,
  dominantRelation,
  canAttack,
  areAllied,
  initialStatus,
  type AllianceLink,
} from './engine/battle/alliance.js';

/** Look up a god by id; throws on unknown id so callers fail fast. */
export function getGod(id: string): OlympianGod {
  const god = OLYMPIAN_REGISTRY[id];
  if (!god) throw new Error(`Unknown Olympian god: ${id}`);
  return god;
}

/** True if a god id exists in the registry. */
export function hasGod(id: string): boolean {
  return id in OLYMPIAN_REGISTRY;
}

/**
 * Instantiate a Faction from a base faction id (one of the 7 in FACTION_REGISTRY).
 * Resolves member gods and returns a live, mutable Faction instance.
 */
export function createFaction(factionId: string): Faction {
  const def = FACTION_REGISTRY[factionId];
  if (!def) throw new Error(`Unknown faction: ${factionId}`);
  return buildFaction(def);
}

/** Count of gods per quadra (verification helper). */
export function godsPerQuadra(): Record<string, number> {
  const out: Record<string, number> = { ALPHA: 0, BETA: 0, GAMMA: 0, DELTA: 0 };
  for (const g of ALL_GODS) out[g.quadra] += 1;
  return out;
}
