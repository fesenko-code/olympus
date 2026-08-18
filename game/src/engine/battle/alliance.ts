/**
 * Alliance state machine between factions — relation-driven (task §"alliance
 * mechanics from intertype relations").
 *
 * Two factions hold an `AllianceStatus` (WAR / TRUCE / PACT / ALLIANCE) that
 * drifts each turn based on the *aggregate* intertype relation between their
 * member gods (relations.ts). Positive relations bias toward ALLIANCE / resist
 * betrayal; negative relations bias toward WAR and forbid reaching ALLIANCE.
 *
 * This is the "cooperative/multi-agent orchestration" gap-fill from the audit:
 * gods act in concert only with factions they are allied to. The battle engine
 * reads this table to decide who may be targeted.
 *
 * Pure functions over a status + aggregate bias. Deterministic.
 */

import type { Faction, RelationKind } from '../../types.js';
import { allianceBias, relationBetween } from '../relations.js';
import type { AllianceStatus } from '../../types.js';

/**
 * Aggregate the intertype bias between two factions by averaging the relation
 * bias of every (godA, godB) pair across their members.
 */
export function factionBias(a: Faction, b: Faction): number {
  let sum = 0;
  let n = 0;
  for (const ga of a.gods) {
    for (const gb of b.gods) {
      sum += allianceBias(relationBetween(ga, gb));
      n++;
    }
  }
  return n === 0 ? 0 : sum / n;
}

/** Friendly display of the dominant relation kind between two factions. */
export function dominantRelation(a: Faction, b: Faction): RelationKind {
  // Pick the strongest-magnitude relation present between any pair.
  let best: RelationKind = 'neutral';
  let bestAbs = -1;
  for (const ga of a.gods) {
    for (const gb of b.gods) {
      const rel = relationBetween(ga, gb);
      const mag = Math.abs(allianceBias(rel));
      if (mag > bestAbs) {
        bestAbs = mag;
        best = rel;
      }
    }
  }
  return best;
}

/** Initial status from the aggregate bias (diplomatic cold-start). */
export function initialStatus(bias: number): AllianceStatus {
  if (bias >= 0.4) return 'PACT';
  if (bias >= 0.15) return 'TRUCE';
  if (bias <= -0.4) return 'WAR';
  return 'TRUCE';
}

/**
 * Advance the alliance status one tick given the current status, the aggregate
 * bias, and whether the two factions have recently clashed.
 *
 * Transition rules:
 *   - bias <= -0.5  ⇒ always drift toward WAR (cannot hold an alliance)
 *   - bias >=  0.4  ⇒ drift toward ALLIANCE (and may stay)
 *   - a recent clash pushes one step toward WAR regardless
 *   - otherwise drift gently by the sign of the bias
 */
export function stepStatus(
  current: AllianceStatus,
  bias: number,
  clashedThisTick: boolean,
): AllianceStatus {
  const ORDER: AllianceStatus[] = ['WAR', 'TRUCE', 'PACT', 'ALLIANCE'];
  const idx = ORDER.indexOf(current);

  // Forbidden state: strong negative bias can never stabilize an alliance.
  if (bias <= -0.5 && current === 'ALLIANCE') return 'PACT';

  if (clashedThisTick) {
    return ORDER[Math.max(0, idx - 1)];
  }
  if (bias >= 0.4) {
    return ORDER[Math.min(ORDER.length - 1, idx + 1)];
  }
  if (bias <= -0.4) {
    return ORDER[Math.max(0, idx - 1)];
  }
  // gentle drift by sign of bias
  const drift = bias > 0.05 ? 1 : bias < -0.05 ? -1 : 0;
  return ORDER[Math.max(0, Math.min(ORDER.length - 1, idx + drift))];
}

/** True when the two factions are at peace enough to not be auto-targeted. */
export function areAllied(a: AllianceStatus): boolean {
  return a === 'PACT' || a === 'ALLIANCE';
}

/**
 * Build the full alliance map for a set of factions. Returns a symmetric map
 * keyed by `${idA}|${idB}` (and the reverse). Each entry is a status + bias.
 */
export interface AllianceLink {
  status: AllianceStatus;
  bias: number;
}

export function buildAllianceMap(factions: readonly Faction[]): Map<string, AllianceLink> {
  const map = new Map<string, AllianceLink>();
  // A faction is always at peace with itself.
  for (const f of factions) {
    const self: AllianceLink = { status: 'ALLIANCE', bias: 1 };
    map.set(allianceKey(f.id, f.id), self);
  }
  for (let i = 0; i < factions.length; i++) {
    for (let j = i + 1; j < factions.length; j++) {
      const a = factions[i];
      const b = factions[j];
      const bias = factionBias(a, b);
      const link: AllianceLink = { status: initialStatus(bias), bias };
      map.set(`${a.id}|${b.id}`, link);
      map.set(`${b.id}|${a.id}`, link);
    }
  }
  return map;
}

/** Stable key for the alliance map. */
export function allianceKey(a: string, b: string): string {
  return `${a}|${b}`;
}

/** Are factions `a` and `b` allowed to be targeted as enemies by each other? */
export function canAttack(
  aId: string,
  bId: string,
  map: Map<string, AllianceLink>,
): boolean {
  const link = map.get(allianceKey(aId, bId));
  if (!link) return true; // unknown pair defaults to hostile
  return !areAllied(link.status);
}
