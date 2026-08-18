/**
 * Olympus combat pipeline — adapts quadra-tactics `combat.ts`.
 *
 * Pipeline: Evade → Crit → FinalDamage, then applies the Olympus relation
 * layer on top:
 *   - Markov stance mods (battle/markov.ts)
 *   - RPS quadra resonance (per audit §6.2: reuse the closed quadra cycle
 *     Γ>Δ>Α>Β>Γ, here via `beatsQuadra`) granting a status effect
 *   - war-sphere bonus (relations.ts `warSphereBonus`) as a flat damage mult
 *
 * Deterministic given the injected rolls. Pure.
 */

import type { OlympianGod } from '../../types.js';
import { beatsQuadra, warSphereBonus } from '../relations.js';
import type { BattleStance } from './markov.js';

/** Final, god-corrected combat stats for one unit. */
export interface UnitStats {
  atk: number;
  magic: number;
  def: number;
  evade: number;
  crit: number;
}

/** Status effect granted by RPS quadra resonance to the advantaged quadra. */
export type ResonanceEffect = 'VAMPIRISM' | 'SILENCE' | 'ARMOR_PIERCE' | 'STUN' | 'NONE';

export interface AttackContext {
  /** Pre-rolled evade check in [0,1). */
  evadeRoll: number;
  /** Pre-rolled crit check in [0,1). */
  critRoll: number;
  attackerGod: OlympianGod;
  defenderGod: OlympianGod;
}

export interface AttackResult {
  outcome: 'EVADED' | 'HIT';
  crit: boolean;
  damage: number;
  effect: ResonanceEffect;
  /** Lifesteal healed to the attacker on VAMPIRISM. */
  attackerHpGain: number;
  /** Defender is silenced (cannot cast) on SILENCE. */
  silenced: boolean;
  /** Defender is stunned (skips next action) on STUN. */
  stunned: boolean;
}

/** Stance-based multipliers, mirrored from quadra-tactics combat.ts. */
function stanceMods(stance: BattleStance): { atkMul: number; evadeMul: number; critMul: number } {
  switch (stance) {
    case 'N_MAGIC':
      return { atkMul: 1.15, evadeMul: 1.1, critMul: 1.0 };
    case 'T_TACTICS':
      return { atkMul: 1.0, evadeMul: 1.0, critMul: 1.0 };
    case 'S_SHADOW':
      return { atkMul: 1.35, evadeMul: 0.85, critMul: 1.5 };
  }
}

/** RPS resonance status effect for an advantaged attacker quadra. */
export function resonanceEffect(attacker: OlympianGod, defender: OlympianGod): ResonanceEffect {
  if (!beatsQuadra(attacker.quadra, defender.quadra)) return 'NONE';
  switch (attacker.quadra) {
    case 'GAMMA': return 'VAMPIRISM'; // Γ→Δ leech
    case 'DELTA': return 'SILENCE';   // Δ→Α mana drain
    case 'ALPHA': return 'ARMOR_PIERCE'; // Α→Β ignore armour
    case 'BETA': return 'STUN';       // Β→Γ stun
  }
}

/**
 * Core combat pipeline. Deterministic given `ctx` rolls. Pure: it returns a
 * result; the caller applies hp changes (so this stays testable).
 */
export function resolveAttack(
  attacker: UnitStats,
  attackerStance: BattleStance,
  attackerGod: OlympianGod,
  defender: UnitStats,
  defenderGod: OlympianGod,
  ctx: AttackContext,
): AttackResult {
  const sm = stanceMods(attackerStance);
  const adv = beatsQuadra(attackerGod.quadra, defenderGod.quadra);
  const effect = resonanceEffect(attackerGod, defenderGod);
  const dmgMod = 1 + warSphereBonus(attackerGod, defenderGod);

  // 1. Evade
  const finalEvade = Math.min(0.9, defender.evade * sm.evadeMul);
  if (ctx.evadeRoll < finalEvade) {
    return { outcome: 'EVADED', crit: false, damage: 0, effect: 'NONE', attackerHpGain: 0, silenced: false, stunned: false };
  }

  // 2. Crit (x2 if RPS advantage)
  const finalCrit = Math.min(0.95, attacker.crit * sm.critMul * (adv ? 2 : 1));
  const crit = ctx.critRoll < finalCrit;

  // 3. Final damage (armour mitigation; min 1)
  const raw = (attacker.atk + attacker.magic * 0.5) * sm.atkMul * (crit ? 2 : 1) * dmgMod;
  const armourFactor = effect === 'ARMOR_PIERCE' ? 0.1 : 0.5;
  const damage = Math.max(1, Math.round(raw - defender.def * armourFactor));

  return {
    outcome: 'HIT',
    crit,
    damage,
    effect,
    attackerHpGain: effect === 'VAMPIRISM' ? Math.round(damage * 0.5) : 0,
    silenced: effect === 'SILENCE',
    stunned: effect === 'STUN',
  };
}
