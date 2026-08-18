/**
 * Olympus Markov battle-stance engine (generalized from quadra-tactics).
 *
 * Reused from quadra-tactics `markov.ts` and extended per the audit gap
 * "Markov is 3-state, binary matrices (GAMMA/DELTA only). Need a generalized
 * matrix-per-faction or a per-god stance table." Olympus keeps the three
 * combat stances N_MAGIC / T_TACTICS / S_SHADOW but adds a per-quadra
 * transition matrix, honoring each quadra's dominant/shadow bias (see
 * `markovBias` on OlympianGod).
 *
 * Deterministic given an injectable RNG. Pure.
 */

import type { Quadra } from '../../types.js';

/** The three combat stances a unit cycles through. */
export type BattleStance = 'N_MAGIC' | 'T_TACTICS' | 'S_SHADOW';

/** Combat events that shift a unit toward its S_SHADOW stance. */
export type MarkovEvent =
  | 'OUT_OF_MANA'
  | 'SURROUNDED'
  | 'ENEMY_CLOSE'
  | 'LOW_HP'
  | 'OUTNUMBERED';

export type MarkovMatrix = {
  [from in BattleStance]: { [to in BattleStance]: number };
};

/**
 * Per-quadra transition matrices. Each row sums to 1.0. The dominant stance
 * is the quadra's favored combat state; S_SHADOW is the stress state that
 * events pull toward. Matrices are explicit (not generated) so each row is
 * provably normalized.
 */
const ALPHA_MATRIX: MarkovMatrix = {
  N_MAGIC: { N_MAGIC: 0.7, T_TACTICS: 0.25, S_SHADOW: 0.05 },
  T_TACTICS: { N_MAGIC: 0.3, T_TACTICS: 0.6, S_SHADOW: 0.1 },
  S_SHADOW: { N_MAGIC: 0.1, T_TACTICS: 0.3, S_SHADOW: 0.6 },
};
const BETA_MATRIX: MarkovMatrix = {
  N_MAGIC: { N_MAGIC: 0.2, T_TACTICS: 0.5, S_SHADOW: 0.3 },
  T_TACTICS: { N_MAGIC: 0.15, T_TACTICS: 0.5, S_SHADOW: 0.35 },
  S_SHADOW: { N_MAGIC: 0.05, T_TACTICS: 0.3, S_SHADOW: 0.65 },
};
const GAMMA_MATRIX: MarkovMatrix = {
  N_MAGIC: { N_MAGIC: 0.25, T_TACTICS: 0.6, S_SHADOW: 0.15 },
  T_TACTICS: { N_MAGIC: 0.3, T_TACTICS: 0.6, S_SHADOW: 0.1 },
  S_SHADOW: { N_MAGIC: 0.1, T_TACTICS: 0.3, S_SHADOW: 0.6 },
};
const DELTA_MATRIX: MarkovMatrix = {
  N_MAGIC: { N_MAGIC: 0.3, T_TACTICS: 0.6, S_SHADOW: 0.1 },
  T_TACTICS: { N_MAGIC: 0.35, T_TACTICS: 0.55, S_SHADOW: 0.1 },
  S_SHADOW: { N_MAGIC: 0.15, T_TACTICS: 0.4, S_SHADOW: 0.45 },
};

/** ALPHA — Enlightenment Court: magic-leaning, shadow only under heavy stress. */
export { ALPHA_MATRIX };
/** BETA — Warhost: shadow-leaning (aggressive), tactics as stabilizer. */
export { BETA_MATRIX };
/** GAMMA — Underworld Syndicate: tactics-leaning (the long game), shadow under stress. */
export { GAMMA_MATRIX };
/** DELTA — Craftwardens: steadier, low shadow pull (defense/duty). */
export { DELTA_MATRIX };

/** Resolve the per-quadra transition matrix. */
export function matrixFor(quadra: Quadra): MarkovMatrix {
  switch (quadra) {
    case 'ALPHA': return ALPHA_MATRIX;
    case 'BETA': return BETA_MATRIX;
    case 'GAMMA': return GAMMA_MATRIX;
    case 'DELTA': return DELTA_MATRIX;
  }
}

/** Seed a unit's initial stance from its quadra's dominant bias. */
export function initialStateFor(dominant: BattleStance): BattleStance {
  return dominant;
}

const STATES: readonly BattleStance[] = ['N_MAGIC', 'T_TACTICS', 'S_SHADOW'];

/** Per-event additive pull toward S_SHADOW (mirrors quadra-tactics nudges). */
const EVENT_NUDGE: Record<MarkovEvent, number> = {
  OUT_OF_MANA: 0.1,
  SURROUNDED: 0.15,
  ENEMY_CLOSE: 0.05,
  LOW_HP: 0.12,
  OUTNUMBERED: 0.08,
};

export interface MarkovResult {
  state: BattleStance;
  prob: Record<BattleStance, number>;
}

/**
 * Compute the next-state distribution given combat events. Events only raise
 * the S_SHADOW pull; the row is renormalised. Returns the same `from` state
 * plus its probability distribution.
 */
export function nextState(
  from: BattleStance,
  events: MarkovEvent[],
  matrix: MarkovMatrix = GAMMA_MATRIX,
): MarkovResult {
  const base = { ...matrix[from] };
  if (events.length === 0) {
    return { state: from, prob: base };
  }
  const nudge = events.reduce((s, e) => s + (EVENT_NUDGE[e] ?? 0), 0);
  const shadow = Math.min(0.95, base.S_SHADOW + nudge);
  const rest = 1 - shadow;
  const others = STATES.filter((s) => s !== 'S_SHADOW');
  const othersSum = others.reduce((s, s2) => s + base[s2], 0) || 1;
  const prob: Record<BattleStance, number> = { N_MAGIC: 0, T_TACTICS: 0, S_SHADOW: shadow };
  for (const s of others) prob[s] = (base[s] / othersSum) * rest;
  return { state: from, prob };
}

/** Sample a concrete next state from a distribution (injectable RNG). */
export function sampleState(
  prob: Record<BattleStance, number>,
  rng: () => number = Math.random,
): BattleStance {
  let roll = rng();
  for (const s of STATES) {
    if (roll < prob[s]) return s;
    roll -= prob[s];
  }
  return 'S_SHADOW';
}
