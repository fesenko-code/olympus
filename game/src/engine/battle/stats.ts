/**
 * Olympus unit stats — derived from a god's Socionics axes (data-as-design).
 *
 * This is the Olympus analogue of quadra-tactics `balance.ts` /
 * `applyTimModifiers`: the god's communicating-vessels axes (E/I, S/N, T/F,
 * J/P) become a combat stat block through a fixed, documented bias formula.
 * The god's quadra also seeds maxHp.
 *
 * Pure functions. No side effects.
 */

import type { OlympianGod } from '../../types.js';
import type { UnitStats } from './combat.js';

/** Base stat block all gods share before axis correction. */
const BASE_STATS: UnitStats = {
  atk: 18,
  magic: 18,
  def: 14,
  evade: 0.12,
  crit: 0.1,
};

/**
 * Derive a combat stat block from a god's axes.
 *   magicBias = (N - S) / 100  -> boosts magic + evade (intuition = magic)
 *   forceBias = (S - N) / 100  -> boosts atk (sensation = force)
 *   logicBias = (T - F) / 100  -> boosts def + crit (thinking = tactics)
 *   vitBias   = (J - P) / 100  -> boosts def + stability (judging = order)
 */
export function deriveStats(god: OlympianGod): UnitStats {
  const a = god.axes;
  const magicBias = (a.N - a.S) / 100;
  const forceBias = (a.S - a.N) / 100;
  const logicBias = (a.T - a.F) / 100;
  const orderBias = (a.J - a.P) / 100;
  const round = (v: number): number => Math.max(1, Math.round(v));
  return {
    atk: round(BASE_STATS.atk * (1 + 0.2 * forceBias)),
    magic: round(BASE_STATS.magic * (1 + 0.25 * magicBias)),
    def: round(BASE_STATS.def * (1 + 0.12 * logicBias + 0.08 * orderBias)),
    evade: Math.min(0.5, +(BASE_STATS.evade * (1 + 0.1 * magicBias)).toFixed(2)),
    crit: Math.min(0.5, +(BASE_STATS.crit * (1 + 0.1 * logicBias)).toFixed(2)),
  };
}

/** Max HP seeded by quadra archetype (BETA Warhost is hardest to crack). */
export function deriveMaxHp(god: OlympianGod): number {
  switch (god.quadra) {
    case 'ALPHA': return 90;
    case 'BETA': return 110;
    case 'GAMMA': return 100;
    case 'DELTA': return 120;
  }
}
