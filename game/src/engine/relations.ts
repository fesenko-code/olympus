/**
 * Intertype-relation → alliance/war mechanics (design spec §3).
 *
 * Every relation resolves to a numeric modifier via pure, queryable functions:
 *   - relationBetween(a, b)      → RelationKind (explicit → quadra-derived → neutral)
 *   - allianceModifier(a, b)     → output/loyalty modifier (dual +, extinguish −)
 *   - allianceBias(kind)         → Markov-flavored bias toward ALLIANCE / betray
 *   - warSphereBonus(native,foe) → RPS order Γ>Δ>Α>Β>Γ + explicit conflict winners
 */

import type { OlympianGod, Quadra, RelationKind } from '../types.js';

/**
 * Canonical RPS ring (do NOT invert): Gamma beats Delta beats Alpha beats Beta
 * beats Gamma. `beats[x]` = the quadra that `x` defeats in war.
 */
export const QUADRA_BEATS: Record<Quadra, Quadra> = {
  GAMMA: 'DELTA',
  DELTA: 'ALPHA',
  ALPHA: 'BETA',
  BETA: 'GAMMA',
};

/** Returns true if quadra `a` defeats quadra `b` in the RPS ring. */
export function beatsQuadra(a: Quadra, b: Quadra): boolean {
  return QUADRA_BEATS[a] === b;
}

/**
 * Explicit conflict outcomes (design spec §3 "Conflict" row).
 * For each pair, the god that wins engagements in its native sphere.
 * winner === 'none' ⇒ mutual attrition / tug-of-war (no clean sphere bonus).
 */
const CONFLICT_WINNERS: Array<{ a: string; b: string; winner: string | 'none' }> = [
  { a: 'athena', b: 'ares', winner: 'athena' }, // calculation beats formation
  { a: 'apollo', b: 'dionysus', winner: 'none' }, // order-vs-chaos, neither fully wins
];

/**
 * Resolve the relation between two gods.
 * Priority: explicit pairwise → same-quadra (mirror) → cross-quadra → neutral.
 * Symmetric: if `b` declares the relation toward `a` but `a` does not, it is reused.
 */
export function relationBetween(a: OlympianGod, b: OlympianGod): RelationKind {
  if (a.id === b.id) return 'neutral';
  const explicit = a.relations[b.id];
  if (explicit) return explicit;
  const reverse = b.relations[a.id];
  if (reverse) return reverse;
  if (a.quadra === b.quadra) return 'mirror';
  return 'cross-quadra';
}

const ALLIANCE_OUTPUT_MODIFIER: Record<RelationKind, number> = {
  dual: 0.2, // +20% joint output
  activation: 0.1, // pact survives conflict
  'semi-dual': 0.05, // conditional buff
  conflict: 0,
  extinguish: -0.08, // loyalty bleed until break
  mirror: -0.05, // shared-resource rivalry
  'cross-quadra': -0.03, // ideological attrition
  neutral: 0,
};

/** Output/loyalty modifier for an (a, b) pair (design spec §3 table). */
export function allianceModifier(a: OlympianGod, b: OlympianGod): number {
  return ALLIANCE_OUTPUT_MODIFIER[relationBetween(a, b)];
}

/**
 * Markov-flavored bias of a relation on the alliance state machine
 * (design spec §3.1): positive → chain biases toward ALLIANCE and resists
 * betray; negative → biases toward betray, cannot reach stable ALLIANCE.
 * Range approximately [-1, 1].
 */
export function allianceBias(kind: RelationKind): number {
  switch (kind) {
    case 'dual':
      return 0.6;
    case 'activation':
      return 0.5;
    case 'semi-dual':
      return 0.2;
    case 'extinguish':
      return -0.8;
    case 'mirror':
      return -0.1;
    case 'cross-quadra':
      return -0.2;
    case 'conflict':
      return 0;
    case 'neutral':
      return 0;
  }
}

function conflictWinner(a: OlympianGod, b: OlympianGod): string | 'none' | null {
  for (const c of CONFLICT_WINNERS) {
    if (c.a === a.id && c.b === b.id) return c.winner;
    if (c.a === b.id && c.b === a.id) return c.winner;
  }
  return null;
}

/**
 * War sphere bonus for `native` fighting `foe`.
 *  - Explicit conflict pair: +0.15 if native is the native winner, −0.15 if it
 *    is the loser, 0 if the conflict is a mutual attrition ('none').
 *  - Otherwise: +0.15 if native's quadra beats foe's quadra (RPS),
 *    −0.15 if foe's quadra beats native's, else 0.
 */
export function warSphereBonus(native: OlympianGod, foe: OlympianGod): number {
  const rel = relationBetween(native, foe);
  if (rel === 'conflict') {
    const winner = conflictWinner(native, foe);
    if (winner === 'none') return 0;
    if (winner === native.id) return 0.15;
    if (winner === foe.id) return -0.15;
    return 0;
  }
  if (beatsQuadra(native.quadra, foe.quadra)) return 0.15;
  if (beatsQuadra(foe.quadra, native.quadra)) return -0.15;
  return 0;
}

/** Human-readable label for a relation kind (for UI / codex). */
export const RELATION_LABELS: Record<RelationKind, string> = {
  dual: 'Duality — alliance anchor',
  activation: 'Activation — pact survives conflict',
  'semi-dual': 'Semi-duality — conditional buff',
  conflict: 'Conflict — sphere asymmetry',
  extinguish: 'Extinguishment — doomed alliance',
  mirror: 'Mirror — same-quadra rivalry',
  'cross-quadra': 'Cross-quadra — ideological tension',
  neutral: 'Neutral',
};
