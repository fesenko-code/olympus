/**
 * Olympus god-skill registry — the "Olympus-skills AI agents" content layer.
 *
 * Each of the 16 `OlympusSkill` roles maps to one signature skill. A skill is
 * pure data (per the data-as-design philosophy): name, cooldown, range, target
 * scope, effect kind, power, and optional lifesteal/status. The battle engine
 * interprets this table — adding a god is adding a god row, not new code.
 *
 * Gap filled per audit §6.1: "No 'skill' concept in either project." Here a
 * skill = cooldown-gated effect, mirroring zero-rts `TECHS` semantics but
 * unit-activated rather than economy/epoch-gated.
 */

import type { OlympusSkill } from '../../types.js';

export type SkillKind =
  | 'damage-magic'
  | 'damage-physical'
  | 'heal'
  | 'buff-atk'
  | 'buff-def'
  | 'debuff-atk'
  | 'debuff-def';

export type SkillTarget = 'enemy' | 'ally' | 'self' | 'all-enemies' | 'all-allies';

export type SkillStatus = 'stun' | 'silence' | 'none';

export interface SkillDef {
  id: OlympusSkill;
  name: string;
  /** Turns before the skill can be cast again. */
  cooldown: number;
  /** Cast range in Chebyshev cells (0 = self only). */
  range: number;
  target: SkillTarget;
  kind: SkillKind;
  /** Stat scaling factor (× caster atk/magic, or × caster magic for heals). */
  power: number;
  /** Heal the caster for 50% of damage dealt. */
  lifesteal?: boolean;
  /** Apply a controlling status to the target. */
  status?: SkillStatus;
  description: string;
}

/**
 * The 16 signature skills, keyed by `OlympusSkill`. Damage values are tuned so
 * a single cast is meaningful but not one-shot (maxHp = 100 in the battle).
 */
export const SKILLS: Record<OlympusSkill, SkillDef> = {
  Orchestrator: {
    id: 'Orchestrator', name: 'Thunderbolt', cooldown: 2, range: 3, target: 'enemy',
    kind: 'damage-magic', power: 1.5, status: 'stun',
    description: 'Zeus hurls a thunderbolt: magic damage + stun.',
  },
  Tactician: {
    id: 'Tactician', name: 'Phalanx Strike', cooldown: 1, range: 1, target: 'enemy',
    kind: 'damage-physical', power: 1.4,
    description: 'Athena leads a minimal-loss melee strike.',
  },
  Diplomacy: {
    id: 'Diplomacy', name: 'Trickster Sabotage', cooldown: 2, range: 3, target: 'enemy',
    kind: 'debuff-atk', power: 1.4,
    description: 'Hermes sabotages an enemy\'s offense.',
  },
  Economy: {
    id: 'Economy', name: 'Soul Drain', cooldown: 2, range: 2, target: 'enemy',
    kind: 'damage-magic', power: 1.2, lifesteal: true,
    description: 'Hades drains life from the living.',
  },
  Order: {
    id: 'Order', name: 'Purifying Light', cooldown: 2, range: 4, target: 'ally',
    kind: 'heal', power: 1.0,
    description: 'Apollo restores an ally with harmonic light.',
  },
  Festival: {
    id: 'Festival', name: 'Revelry', cooldown: 3, range: 0, target: 'all-allies',
    kind: 'buff-atk', power: 1.2,
    description: 'Dionysus rallies every ally\'s fervor.',
  },
  Hearth: {
    id: 'Hearth', name: 'Hearth Ward', cooldown: 2, range: 3, target: 'ally',
    kind: 'buff-def', power: 1.3,
    description: 'Hestia reinforces an ally\'s hearth.',
  },
  Status: {
    id: 'Status', name: 'Royal Decree', cooldown: 2, range: 3, target: 'ally',
    kind: 'buff-atk', power: 1.2,
    description: 'Hera enforces loyalty and martial pride.',
  },
  Line: {
    id: 'Line', name: 'Battle Fury', cooldown: 1, range: 1, target: 'enemy',
    kind: 'damage-physical', power: 1.6,
    description: 'Ares commits a relentless frontal assault.',
  },
  Seasonal: {
    id: 'Seasonal', name: 'Bloom & Decay', cooldown: 2, range: 2, target: 'enemy',
    kind: 'damage-magic', power: 1.2,
    description: 'Persephone wields the cycle of life and death.',
  },
  Expansion: {
    id: 'Expansion', name: 'Tidal Crash', cooldown: 3, range: 2, target: 'all-enemies',
    kind: 'damage-magic', power: 0.9,
    description: 'Poseidon crashes waves over every nearby foe.',
  },
  Seduce: {
    id: 'Seduce', name: 'Charm', cooldown: 2, range: 3, target: 'enemy',
    kind: 'debuff-atk', power: 1.5,
    description: 'Aphrodite beguiles an enemy into weakness.',
  },
  Progress: {
    id: 'Progress', name: 'Forged Future', cooldown: 2, range: 0, target: 'self',
    kind: 'buff-atk', power: 1.2,
    description: 'Prometheus arms himself with stolen fire.',
  },
  Forge: {
    id: 'Forge', name: 'Armor Forged', cooldown: 2, range: 0, target: 'self',
    kind: 'buff-def', power: 1.3,
    description: 'Hephaestus hammers his own defensive plate.',
  },
  Wild: {
    id: 'Wild', name: 'Hunter\'s Shot', cooldown: 1, range: 3, target: 'enemy',
    kind: 'damage-physical', power: 1.4,
    description: 'Artemis fires from the wilds.',
  },
  Sustain: {
    id: 'Sustain', name: 'Bountiful Growth', cooldown: 2, range: 3, target: 'ally',
    kind: 'heal', power: 0.9,
    description: 'Demeter mends an ally with growth.',
  },
};
