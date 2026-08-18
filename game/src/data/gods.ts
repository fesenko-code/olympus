/**
 * Olympian god registry — the core data layer.
 *
 * Each god is ONE row. Mechanics never change when you add a god; you add a
 * row. Socionics TIM + quadra are taken verbatim from the Olympus base
 * (`references/sociomics-map.md`) and the OLYMPUS-GAME-DESIGN spec, which agree
 * on the classifications (Zeus=SLE/Beta, Athena=LSE/Delta, Hades=ILI/Gamma,
 * Apollo=LII/Alpha, Hermes=ILE/Alpha, Hera=EIE/Beta, Hephaestus=SLI/Gamma).
 *
 * The `agent` field binds each god to one of the seven `olympus-*` agent
 * archetypes shipped in the base repo, so the AI scaffolding (src/ai/agents.ts)
 * can wrap a real, summonable skill.
 *
 * Canonical distribution (16 gods, 4 per quadra):
 *   ALPHA EnlightenmentCourt : apollo, dionysus, hermes, hestia
 *   BETA  Warhost           : zeus, ares, hera, persephone
 *   GAMMA UnderworldSyndicate: hades, poseidon, aphrodite, prometheus
 *   DELTA Craftwardens      : athena, hephaestus, artemis, demeter
 */

import type {
  Axis,
  FactionArchetype,
  OlympianGod,
  OlympusAgentId,
  OlympusSkill,
  Quadra,
  RelationKind,
  TimCode,
} from '../types.js';

/** Build communicating-vessels axes; the opposite pole is auto-derived. */
function axis(E: number, S: number, T: number, J: number): Axis {
  return {
    E,
    I: 100 - E,
    S,
    N: 100 - S,
    T,
    F: 100 - T,
    J,
    P: 100 - J,
  };
}

interface GodSeed {
  id: string;
  name: string;
  tim: string;
  code: TimCode;
  quadra: Quadra;
  archetype: FactionArchetype;
  skill: OlympusSkill;
  agent: OlympusAgentId;
  dominant: 'N_MAGIC' | 'T_TACTICS' | 'S_SHADOW';
  shadow: 'N_MAGIC' | 'T_TACTICS' | 'S_SHADOW' | 'IDLE';
  E: number;
  S: number;
  T: number;
  J: number;
  relations?: Array<[string, RelationKind]>;
}

const SEEDS: GodSeed[] = [
  // ── ALPHA — Enlightenment Court (science, trade, revelry) ──
  {
    id: 'apollo', name: 'Apollo', tim: 'ЛІІ «Робесп’єр»', code: 'INTj',
    quadra: 'ALPHA', archetype: 'EnlightenmentCourt', skill: 'Order', agent: 'apollo',
    dominant: 'N_MAGIC', shadow: 'S_SHADOW', E: 10, S: 30, T: 70, J: 70,
    relations: [['dionysus', 'conflict']],
  },
  {
    id: 'dionysus', name: 'Dionysus', tim: 'ЕСЕ «Гюго»', code: 'ESFj',
    quadra: 'ALPHA', archetype: 'EnlightenmentCourt', skill: 'Festival', agent: 'apollo',
    dominant: 'N_MAGIC', shadow: 'S_SHADOW', E: 80, S: 70, T: 20, J: 75,
    relations: [['apollo', 'conflict']],
  },
  {
    id: 'hermes', name: 'Hermes', tim: 'ІЛЕ «Дон Кіхот»', code: 'ENTp',
    quadra: 'ALPHA', archetype: 'EnlightenmentCourt', skill: 'Diplomacy', agent: 'hermes-ag',
    dominant: 'N_MAGIC', shadow: 'S_SHADOW', E: 75, S: 35, T: 65, J: 30,
    relations: [['hestia', 'dual']],
  },
  {
    id: 'hestia', name: 'Hestia', tim: 'СЕІ «Дюма»', code: 'ISFp',
    quadra: 'ALPHA', archetype: 'EnlightenmentCourt', skill: 'Hearth', agent: 'hephaestus',
    dominant: 'N_MAGIC', shadow: 'S_SHADOW', E: 20, S: 60, T: 25, J: 35,
    relations: [['hermes', 'dual']],
  },

  // ── BETA — Warhost (conquest, order, status) ──
  {
    id: 'zeus', name: 'Zeus', tim: 'СЛЕ «Жуков»', code: 'ESTp',
    quadra: 'BETA', archetype: 'Warhost', skill: 'Orchestrator', agent: 'zeus',
    dominant: 'S_SHADOW', shadow: 'S_SHADOW', E: 80, S: 70, T: 60, J: 35,
    relations: [['hera', 'activation']],
  },
  {
    id: 'ares', name: 'Ares', tim: 'ЛСІ «Максим Горький»', code: 'ISTj',
    quadra: 'BETA', archetype: 'Warhost', skill: 'Line', agent: 'zeus',
    dominant: 'S_SHADOW', shadow: 'S_SHADOW', E: 25, S: 75, T: 70, J: 70,
    relations: [['athena', 'conflict']],
  },
  {
    id: 'hera', name: 'Hera', tim: 'ЕІЕ «Гамлет»', code: 'ENFj',
    quadra: 'BETA', archetype: 'Warhost', skill: 'Status', agent: 'hera',
    dominant: 'S_SHADOW', shadow: 'S_SHADOW', E: 75, S: 30, T: 30, J: 70,
    relations: [['zeus', 'activation']],
  },
  {
    id: 'persephone', name: 'Persephone', tim: 'ІЕІ «Єсенін»', code: 'INFp',
    quadra: 'BETA', archetype: 'Warhost', skill: 'Seasonal', agent: 'hades',
    dominant: 'S_SHADOW', shadow: 'S_SHADOW', E: 25, S: 35, T: 30, J: 30,
    relations: [['hades', 'semi-dual']],
  },

  // ── GAMMA — Underworld Syndicate (economy, ambition, long game) ──
  {
    id: 'hades', name: 'Hades', tim: 'ІЛІ «Бальзак»', code: 'INTp',
    quadra: 'GAMMA', archetype: 'UnderworldSyndicate', skill: 'Economy', agent: 'hades',
    dominant: 'T_TACTICS', shadow: 'T_TACTICS', E: 20, S: 30, T: 65, J: 30,
    relations: [['persephone', 'semi-dual']],
  },
  {
    id: 'poseidon', name: 'Poseidon', tim: 'СЕЕ «Наполеон»', code: 'ESFp',
    quadra: 'GAMMA', archetype: 'UnderworldSyndicate', skill: 'Expansion', agent: 'zeus',
    dominant: 'T_TACTICS', shadow: 'T_TACTICS', E: 75, S: 70, T: 25, J: 35,
    relations: [],
  },
  {
    id: 'aphrodite', name: 'Aphrodite', tim: 'ЕСІ «Драйзер»', code: 'ISFj',
    quadra: 'GAMMA', archetype: 'UnderworldSyndicate', skill: 'Seduce', agent: 'hera',
    dominant: 'T_TACTICS', shadow: 'T_TACTICS', E: 25, S: 65, T: 25, J: 70,
    relations: [['hephaestus', 'extinguish']],
  },
  {
    id: 'prometheus', name: 'Prometheus', tim: 'ЛІЕ «Джек Лондон»', code: 'ENTj',
    quadra: 'GAMMA', archetype: 'UnderworldSyndicate', skill: 'Progress', agent: 'athena',
    dominant: 'T_TACTICS', shadow: 'T_TACTICS', E: 70, S: 30, T: 70, J: 70,
    relations: [],
  },

  // ── DELTA — Craftwardens (defense, craft, duty) ──
  {
    id: 'athena', name: 'Athena', tim: 'ЛСЕ «Штірліц»', code: 'ESTj',
    quadra: 'DELTA', archetype: 'Craftwardens', skill: 'Tactician', agent: 'athena',
    dominant: 'T_TACTICS', shadow: 'T_TACTICS', E: 70, S: 70, T: 65, J: 70,
    relations: [['ares', 'conflict']],
  },
  {
    id: 'hephaestus', name: 'Hephaestus', tim: 'СЛІ «Габен»', code: 'ISTp',
    quadra: 'DELTA', archetype: 'Craftwardens', skill: 'Forge', agent: 'hephaestus',
    dominant: 'T_TACTICS', shadow: 'T_TACTICS', E: 20, S: 70, T: 70, J: 70,
    relations: [['aphrodite', 'extinguish']],
  },
  {
    id: 'artemis', name: 'Artemis', tim: 'ІЕЕ «Гекслі»', code: 'ENFp',
    quadra: 'DELTA', archetype: 'Craftwardens', skill: 'Wild', agent: 'apollo',
    dominant: 'T_TACTICS', shadow: 'T_TACTICS', E: 75, S: 30, T: 25, J: 30,
    relations: [],
  },
  {
    id: 'demeter', name: 'Demeter', tim: 'ЕІІ «Достоєвський»', code: 'INFj',
    quadra: 'DELTA', archetype: 'Craftwardens', skill: 'Sustain', agent: 'hades',
    dominant: 'T_TACTICS', shadow: 'T_TACTICS', E: 25, S: 30, T: 30, J: 75,
    relations: [],
  },
];

function buildGod(seed: GodSeed): OlympianGod {
  const relations: Partial<Record<string, RelationKind>> = {};
  if (seed.relations) {
    for (const [other, kind] of seed.relations) relations[other] = kind;
  }
  return {
    id: seed.id,
    name: seed.name,
    tim: seed.tim,
    code: seed.code,
    quadra: seed.quadra,
    axes: axis(seed.E, seed.S, seed.T, seed.J),
    factionArchetype: seed.archetype,
    olympusSkill: seed.skill,
    agent: seed.agent,
    markovBias: { dominant: seed.dominant, shadow: seed.shadow },
    relations,
  };
}

/** All 16 Olympian gods, keyed by id. */
export const OLYMPIAN_REGISTRY: Record<string, OlympianGod> = Object.freeze(
  SEEDS.reduce<Record<string, OlympianGod>>((acc, seed) => {
    acc[seed.id] = buildGod(seed);
    return acc;
  }, {}),
);

/** Ordered list of all gods. */
export const ALL_GODS: readonly OlympianGod[] = Object.freeze(
  Object.values(OLYMPIAN_REGISTRY),
);
