/**
 * Olympus game — acceptance tests.
 *
 * Covers the task acceptance criteria:
 *  - faction creation (createFaction) + all 16 gods present, 4 per quadra
 *  - intertype relation lookups (explicit + derived + symmetric)
 *  - alliance modifiers (dual > 0, extinguish < 0)
 *  - RPS order Γ>Δ>Α>Β>Γ holds in warSphereBonus
 *  - skill hooks are callable (Orchestrator/Tactician/Diplomat/Economist)
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_GODS,
  OLYMPIAN_REGISTRY,
  FACTION_REGISTRY,
  createFaction,
  getGod,
  hasGod,
  godsPerQuadra,
  relationBetween,
  allianceModifier,
  allianceBias,
  warSphereBonus,
  beatsQuadra,
  QUADRA_BEATS,
  assignBehavior,
  createSkillHook,
} from '../src/index.js';

describe('god registry', () => {
  it('has 16 gods', () => {
    expect(ALL_GODS.length).toBe(16);
    expect(Object.keys(OLYMPIAN_REGISTRY).length).toBe(16);
  });

  it('has exactly 4 gods per quadra', () => {
    const counts = godsPerQuadra();
    expect(counts).toEqual({ ALPHA: 4, BETA: 4, GAMMA: 4, DELTA: 4 });
  });

  it('axis pairs sum to 100 (communicating vessels)', () => {
    for (const g of ALL_GODS) {
      expect(g.axes.E + g.axes.I).toBe(100);
      expect(g.axes.S + g.axes.N).toBe(100);
      expect(g.axes.T + g.axes.F).toBe(100);
      expect(g.axes.J + g.axes.P).toBe(100);
    }
  });

  it('every god binds to a base Olympus agent', () => {
    const valid = new Set(['zeus', 'athena', 'hermes-ag', 'hades', 'hera', 'apollo', 'hephaestus']);
    for (const g of ALL_GODS) expect(valid.has(g.agent)).toBe(true);
  });
});

describe('faction creation (public API)', () => {
  it('creates each of the 7 base factions with member gods', () => {
    for (const id of Object.keys(FACTION_REGISTRY)) {
      const f = createFaction(id);
      expect(f.id).toBe(id);
      expect(f.gods.length).toBeGreaterThan(0);
      for (const g of f.gods) expect(hasGod(g.id)).toBe(true);
    }
  });

  it('builds a faction from a quadra definition (Enlightenment Court)', () => {
    const court = createFaction('enlightenment-court');
    expect(court.quadra).toBe('ALPHA');
    expect(court.archetype).toBe('EnlightenmentCourt');
    expect(court.gods.map((g) => g.id)).toEqual(['apollo', 'dionysus', 'hermes', 'hestia']);
  });

  it('getGod resolves a known god and throws on unknown', () => {
    expect(getGod('zeus').name).toBe('Zeus');
    expect(() => getGod('not-a-god')).toThrow();
  });
});

describe('intertype relation lookups', () => {
  const zeus = getGod('zeus');
  const hera = getGod('hera');
  const athena = getGod('athena');
  const ares = getGod('ares');
  const hermes = getGod('hermes');
  const hestia = getGod('hestia');

  it('resolves explicit relations', () => {
    expect(relationBetween(zeus, hera)).toBe('activation');
    expect(relationBetween(athena, ares)).toBe('conflict');
  });

  it('is symmetric for explicit pairs', () => {
    expect(relationBetween(hera, zeus)).toBe('activation');
    expect(relationBetween(ares, athena)).toBe('conflict');
  });

  it('derives mirror for same-quadra pairs and cross-quadra otherwise', () => {
    // Apollo & Hestia are both ALPHA with no explicit link → mirror.
    expect(relationBetween(getGod('apollo'), getGod('hestia'))).toBe('mirror');
    // Apollo (ALPHA) vs Zeus (BETA) — no explicit link → cross-quadra
    expect(relationBetween(getGod('apollo'), zeus)).toBe('cross-quadra');
  });

  it('dual pair Hermes↔Hestia', () => {
    expect(relationBetween(hermes, hestia)).toBe('dual');
    expect(relationBetween(hestia, hermes)).toBe('dual');
  });
});

describe('alliance modifiers', () => {
  const hermes = getGod('hermes');
  const hestia = getGod('hestia');
  const aphrodite = getGod('aphrodite');
  const hephaestus = getGod('hephaestus');

  it('dual gives a positive modifier, extinguish a negative one', () => {
    expect(allianceModifier(hermes, hestia)).toBeGreaterThan(0);
    expect(allianceModifier(aphrodite, hephaestus)).toBeLessThan(0);
  });

  it('allianceBias is positive for dual/activation, negative for extinguish', () => {
    expect(allianceBias(relationBetween(hermes, hestia))).toBeGreaterThan(0);
    expect(allianceBias(relationBetween(getGod('zeus'), getGod('hera')))).toBeGreaterThan(0);
    expect(allianceBias(relationBetween(aphrodite, hephaestus))).toBeLessThan(0);
  });
});

describe('RPS order Γ>Δ>Α>Β>Γ in warSphereBonus', () => {
  it('ring is GAMMA>DELTA>ALPHA>BETA>GAMMA', () => {
    expect(QUADRA_BEATS.GAMMA).toBe('DELTA');
    expect(QUADRA_BEATS.DELTA).toBe('ALPHA');
    expect(QUADRA_BEATS.ALPHA).toBe('BETA');
    expect(QUADRA_BEATS.BETA).toBe('GAMMA');
  });

  it('a quadra that beats another gives its god +0.15', () => {
    const hades = getGod('hades'); // GAMMA
    const athena = getGod('athena'); // DELTA (GAMMA beats DELTA)
    expect(beatsQuadra('GAMMA', 'DELTA')).toBe(true);
    expect(warSphereBonus(hades, athena)).toBe(0.15);
  });

  it('the reverse match gives -0.15', () => {
    const hades = getGod('hades');
    const athena = getGod('athena');
    expect(warSphereBonus(athena, hades)).toBe(-0.15);
  });

  it('explicit conflict winner (Athena vs Ares) respects native sphere', () => {
    const athena = getGod('athena');
    const ares = getGod('ares');
    expect(warSphereBonus(athena, ares)).toBe(0.15); // Athena wins by calc
    expect(warSphereBonus(ares, athena)).toBe(-0.15); // Ares loses
  });
});

describe('skill hooks are callable', () => {
  it('creates a hook per named brief role and invokes it', () => {
    const zeus = getGod('zeus');
    const athena = getGod('athena');
    const hermes = getGod('hermes');
    const hades = getGod('hades');

    const orchestrator = createSkillHook(zeus);
    const tactician = createSkillHook(athena);
    const diplomat = createSkillHook(hermes);
    const economist = createSkillHook(hades);

    expect(orchestrator.skill).toBe('Orchestrator');
    expect(tactician.skill).toBe('Tactician');
    expect(diplomat.skill).toBe('Diplomacy');
    expect(economist.skill).toBe('Economy');

    const r1 = orchestrator.invoke({ state: {}, target: 'athena' });
    expect(r1.godId).toBe('zeus');
    expect(r1.decision).toMatch(/Zeus/);

    const r2 = tactician.invoke({ state: {} });
    expect(r2.decision).toMatch(/Athena/);

    const r3 = diplomat.invoke({ state: {}, target: 'zeus' });
    expect(r3.decision).toMatch(/Hermes/);

    const r4 = economist.invoke({ state: {} });
    expect(r4.decision).toMatch(/Hades/);
  });

  it('assigns a hook per god for a whole faction', () => {
    const warhost = createFaction('warhost');
    const hooks = assignBehavior(warhost);
    expect(hooks.length).toBe(4);
    for (const h of hooks) {
      const res = h.invoke({ state: {} });
      expect(res).toHaveProperty('godId');
      expect(res.skill).toBe(h.skill);
    }
  });
});
