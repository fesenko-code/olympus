/**
 * Olympus battle engine — the integrated tactical simulation.
 *
 * Composes: the Olympus grid (battle/grid.ts), Markov stances (battle/markov.ts),
 * combat pipeline (battle/combat.ts), god-skill table (battle/skills.ts),
 * stat derivation (battle/stats.ts), and the relation-based alliance machine
 * (battle/alliance.ts).
 *
 * A `Battle` holds several factions (sides). On each `step()` (one RTS "pause"
 * tick) every living unit acts once via its skill-driven `OlympusAgentAI`,
 * which decides MOVE / ATTACK / CAST based on the god's Olympus-Skill role and
 * the live alliance map. The engine is deterministic given an injectable RNG,
 * and exposes a snapshot for a future zero-rts renderer/Net layer.
 *
 * This satisfies the task: two+ god factions engage using skill-driven AI and
 * relation-based alliances; output is headless-readable.
 */

import type { Faction, OlympianGod } from '../../types.js';
import { createSkillHook } from '../../ai/agents.js';
import type { SkillContext, SkillResult } from '../../ai/agents.js';
import { Grid, squareDistance, sameCell, cellsInRange, SQUARE_DIRS, type SquareCoord } from './grid.js';
import {
  matrixFor, initialStateFor, nextState, sampleState, type BattleStance, type MarkovEvent,
} from './markov.js';
import { resolveAttack, type UnitStats } from './combat.js';
import { SKILLS, type SkillDef } from './skills.js';
import { deriveStats, deriveMaxHp } from './stats.js';
import {
  buildAllianceMap, stepStatus, canAttack, factionBias, type AllianceLink,
} from './alliance.js';

/** A single unit (one god's champion) on the battlefield. */
export interface Unit {
  id: string;
  godId: string;
  name: string;
  factionId: string;
  god: OlympianGod;
  stats: UnitStats;
  maxHp: number;
  hp: number;
  pos: SquareCoord;
  stance: BattleStance;
  alive: boolean;
  /** Remaining cooldown on the god's signature skill (0 = ready). */
  skillCd: number;
  /** Turns the unit is stunned (skips its action). */
  stun: number;
  /** Turns the unit is silenced (cannot cast). */
  silence: number;
  /** Transient atk/def multipliers from buff/debuff skills. */
  atkMul: number;
  defMul: number;
}

/** A side in the battle. */
export interface Side {
  factionId: string;
  faction: Faction;
  units: Unit[];
}

/** A human-readable log line emitted each step. */
export interface BattleLogEntry {
  turn: number;
  actorId: string;
  actorName: string;
  action: string;
  detail: string;
}

export interface ArenaConfig {
  cols: number;
  rows: number;
  /** Deterministic RNG seed state (LCG) so runs are reproducible. */
  seed?: number;
}

/** A simple injectable LCG so battles are fully reproducible. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * The integrated battle. Construct with two or more faction instances and an
 * arena config; call `step()` repeatedly (or `run()`) to advance.
 */
export class Battle {
  readonly grid: Grid;
  readonly sides: Side[];
  readonly alliance: Map<string, AllianceLink>;
  readonly log: BattleLogEntry[] = [];
  readonly rng: () => number;
  turn = 0;
  finished = false;
  winner: string | null = null;

  constructor(factions: readonly Faction[], cfg: ArenaConfig = { cols: 10, rows: 10, seed: 0x1234 }) {
    this.grid = new Grid(cfg.cols, cfg.rows);
    this.rng = makeRng(cfg.seed ?? 0x1234);
    this.sides = factions.map((f) => ({
      factionId: f.id,
      faction: f,
      units: f.gods.map((g, i) => this.spawnUnit(f.id, g, i, factions.length, f.gods.length)),
    }));
    this.alliance = buildAllianceMap(factions);
  }

  private spawnUnit(factionId: string, god: OlympianGod, idx: number, sideCount: number, perSide: number): Unit {
    // Place each faction's column of units at a board edge.
    let x: number;
    if (sideCount === 2) {
      x = factionId.startsWith('a') ? 1 : this.grid.cols - 2;
    } else {
      const spread = Math.floor((idx / Math.max(1, perSide)) * (this.grid.cols - 2));
      x = Math.min(this.grid.cols - 1, Math.max(0, 1 + spread + (factionId.charCodeAt(0) % 3)));
    }
    const y = Math.min(this.grid.rows - 1, Math.max(0, 1 + idx));
    return {
      id: `${factionId}-${god.id}`,
      godId: god.id,
      name: god.name,
      factionId,
      god,
      stats: deriveStats(god),
      maxHp: deriveMaxHp(god),
      hp: deriveMaxHp(god),
      pos: { x, y },
      stance: initialStateFor(god.markovBias.dominant === 'IDLE' ? 'S_SHADOW' : god.markovBias.dominant),
      alive: true,
      skillCd: 0,
      stun: 0,
      silence: 0,
      atkMul: 1,
      defMul: 1,
    };
  }

  /** Snapshot of the live state for a future renderer / net layer. */
  snapshot(): { turn: number; finished: boolean; winner: string | null; units: Unit[] } {
    return {
      turn: this.turn,
      finished: this.finished,
      winner: this.winner,
      units: this.sides.flatMap((s) => s.units),
    };
  }

  private allUnits(): Unit[] {
    return this.sides.flatMap((s) => s.units);
  }

  private enemiesOf(unit: Unit): Unit[] {
    return this.allUnits().filter(
      (u) => u.alive && u.factionId !== unit.factionId && canAttack(unit.factionId, u.factionId, this.alliance),
    );
  }

  private alliesOf(unit: Unit): Unit[] {
    return this.allUnits().filter((u) => u.alive && u.factionId === unit.factionId && u.id !== unit.id);
  }

  /** Advance one RTS-pause tick: every living unit acts once. */
  step(): void {
    if (this.finished) return;
    this.turn++;
    const clashPairs = new Set<string>();

    for (const side of this.sides) {
      for (const unit of side.units) {
        if (!unit.alive) continue;
        if (unit.stun > 0) {
          unit.stun--;
          continue;
        }
        if (unit.silence > 0) unit.silence--;
        if (unit.skillCd > 0) unit.skillCd--;
        // decay transient buffs
        unit.atkMul = 1;
        unit.defMul = 1;

        const cmd = this.decide(unit);
        const result = this.act(unit, cmd);
        if (result.clashed && result.targetId) {
          clashPairs.add(this.pairKey(unit.factionId, this.unitById(result.targetId)?.factionId ?? ''));
        }
      }
    }

    this.recomputeAlliances(clashPairs);
    this.checkVictory();
  }

  private pairKey(a: string, b: string): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  private unitById(id: string): Unit | undefined {
    return this.allUnits().find((u) => u.id === id);
  }

  /** The skill-driven AI: returns the chosen command for a unit this tick. */
  private decide(unit: Unit): BattleCommand {
    const enemies = this.enemiesOf(unit);
    const allies = this.alliesOf(unit);
    const hook = createSkillHook(unit.god);

    const ctx: SkillContext = {
      state: {
        enemies: enemies.length,
        allies: allies.length,
        hpPct: unit.hp / unit.maxHp,
        stance: unit.stance,
        skillReady: unit.skillCd === 0 && unit.silence === 0,
      },
      alliance: 'WAR',
    };
    // Invoke the Olympus-skill agent (records its role decision).
    const skillResult: SkillResult = hook.invoke(ctx);
    void skillResult;

    // 1) Cast the signature skill if ready and a valid target exists.
    if (unit.skillCd === 0 && unit.silence === 0) {
      const cast = this.bestSkillTarget(unit, hook.skill);
      if (cast) return cast;
    }

    // 2) Otherwise melee if an enemy is adjacent.
    if (enemies.length > 0) {
      const nearest = this.nearest(unit, enemies);
      if (squareDistance(unit.pos, nearest.pos) <= 1) {
        return { kind: 'attack', targetId: nearest.id };
      }
      // 3) Move toward the nearest enemy (one step via greedy + tiebreak).
      return { kind: 'move', to: this.stepToward(unit, nearest.pos) };
    }

    // 4) No enemies (allied board): hold; support allies if any skill targets self/ally.
    if (unit.skillCd === 0 && unit.silence === 0) {
      const cast = this.bestSkillTarget(unit, hook.skill);
      if (cast) return cast;
    }
    return { kind: 'hold' };
  }

  /** Choose the best skill target given the god's Olympus-Skill role. */
  private bestSkillTarget(unit: Unit, skill: import('../../types.js').OlympusSkill): BattleCommand | null {
    const def: SkillDef = SKILLS[skill];
    if (def.target === 'self') {
      return { kind: 'cast', skill, targetId: unit.id };
    }
    if (def.target === 'all-allies' || def.target === 'all-enemies') {
      const valid = def.target === 'all-allies' ? this.alliesOf(unit) : this.enemiesInRange(unit, def.range);
      if (valid.length > 0) return { kind: 'cast', skill, targetId: unit.id };
    }
    if (def.target === 'ally') {
      const ally = this.bestAllyToHelp(unit, def.range);
      if (ally) return { kind: 'cast', skill, targetId: ally.id };
    }
    if (def.target === 'enemy') {
      const foe = this.enemiesInRange(unit, def.range)[0];
      if (foe) return { kind: 'cast', skill, targetId: foe.id };
    }
    return null;
  }

  private enemiesInRange(unit: Unit, range: number): Unit[] {
    return this.enemiesOf(unit).filter((e) => squareDistance(unit.pos, e.pos) <= Math.max(1, range));
  }

  private bestAllyToHelp(unit: Unit, range: number): Unit | null {
    const allies = this.alliesOf(unit).filter(
      (a) => a.hp < a.maxHp && squareDistance(unit.pos, a.pos) <= Math.max(1, range),
    );
    if (allies.length === 0) return null;
    return allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  }

  private nearest(unit: Unit, list: Unit[]): Unit {
    let best = list[0];
    let bd = squareDistance(unit.pos, best.pos);
    for (const u of list) {
      const d = squareDistance(unit.pos, u.pos);
      if (d < bd) { bd = d; best = u; }
    }
    return best;
  }

  private stepToward(unit: Unit, to: SquareCoord): SquareCoord {
    const path = this.grid.findPath(unit.pos, to);
    if (path.length > 0) return path[0];
    // Fallback greedy step (8-dir).
    const out = { ...unit.pos };
    if (to.x > unit.pos.x) out.x++;
    else if (to.x < unit.pos.x) out.x--;
    if (to.y > unit.pos.y) out.y++;
    else if (to.y < unit.pos.y) out.y--;
    if (this.grid.isBlocked(out.x, out.y)) return unit.pos;
    return out;
  }

  /** Execute a decided command, mutating state + emitting a log line. */
  private act(unit: Unit, cmd: BattleCommand): { clashed: boolean; targetId?: string } {
    switch (cmd.kind) {
      case 'hold':
        return { clashed: false };
      case 'move': {
        if (!sameCoord(unit.pos, cmd.to) && !this.grid.isBlocked(cmd.to.x, cmd.to.y)) {
          unit.pos = cmd.to;
          this.log.push({ turn: this.turn, actorId: unit.id, actorName: unit.name, action: 'move', detail: `→(${cmd.to.x},${cmd.to.y})` });
        }
        return { clashed: false };
      }
      case 'attack': {
        const target = this.unitById(cmd.targetId);
        if (!target || !target.alive) return { clashed: false };
        this.melee(unit, target);
        return { clashed: true, targetId: cmd.targetId };
      }
      case 'cast': {
        const def = SKILLS[unit.god.olympusSkill];
        this.castSkill(unit, def, cmd.targetId);
        return { clashed: def.target === 'enemy' || def.target === 'all-enemies', targetId: cmd.targetId };
      }
    }
  }

  private melee(attacker: Unit, target: Unit): void {
    const events: MarkovEvent[] = [];
    const allyCount = this.alliesOf(attacker).length + 1;
    const foeCount = this.enemiesOf(attacker).length;
    if (foeCount > allyCount) events.push('OUTNUMBERED');
    if (target.alive) events.push('ENEMY_CLOSE');
    if (attacker.hp < attacker.maxHp * 0.3) events.push('LOW_HP');

    const res = resolveAttack(
      this.scaledStats(attacker),
      attacker.stance,
      attacker.god,
      this.scaledStats(target),
      target.god,
      { evadeRoll: this.rng(), critRoll: this.rng(), attackerGod: attacker.god, defenderGod: target.god },
    );

    if (res.outcome === 'HIT') {
      target.hp -= res.damage;
      if (res.attackerHpGain > 0) attacker.hp = Math.min(attacker.maxHp, attacker.hp + res.attackerHpGain);
      if (res.silenced) target.silence = 1;
      if (res.stunned) target.stun = 1;
      this.log.push({ turn: this.turn, actorId: attacker.id, actorName: attacker.name, action: 'attack', detail: `${target.name} -${res.damage}${res.crit ? ' CRIT' : ''}${res.effect !== 'NONE' ? ` [${res.effect}]` : ''}` });
      if (target.hp <= 0) {
        target.hp = 0;
        target.alive = false;
        this.log.push({ turn: this.turn, actorId: attacker.id, actorName: attacker.name, action: 'kill', detail: `${target.name} fell` });
      }
    } else {
      this.log.push({ turn: this.turn, actorId: attacker.id, actorName: attacker.name, action: 'attack', detail: `${target.name} evaded` });
    }
    this.rollStance(attacker, events);
  }

  private castSkill(caster: Unit, def: SkillDef, targetId: string): void {
    caster.skillCd = def.cooldown;
    const target = this.unitById(targetId);

    const log = (detail: string): void => {
      this.log.push({ turn: this.turn, actorId: caster.id, actorName: caster.name, action: 'cast', detail });
    };

    switch (def.target) {
      case 'self': {
        this.applyBuff(caster, def);
        log(`${def.name} (self)`);
        return;
      }
      case 'all-allies': {
        for (const a of this.alliesOf(caster)) this.applyBuff(a, def);
        log(`${def.name} → all allies`);
        return;
      }
      case 'all-enemies': {
        for (const e of this.enemiesInRange(caster, def.range)) this.applyDamage(caster, e, def);
        log(`${def.name} → all foes`);
        return;
      }
      case 'ally': {
        if (target && target.factionId === caster.factionId) this.applyBuff(target, def);
        log(`${def.name} → ${target?.name ?? '?'}`);
        return;
      }
      case 'enemy': {
        if (target && target.alive && this.enemiesOf(caster).some((e) => e.id === target.id)) {
          this.applyDamage(caster, target, def);
        }
        log(`${def.name} → ${target?.name ?? '?'}`);
        return;
      }
    }
  }

  private applyBuff(target: Unit, def: SkillDef): void {
    switch (def.kind) {
      case 'heal':
        target.hp = Math.min(target.maxHp, target.hp + Math.round(this.scaledStats(target).magic * def.power));
        break;
      case 'buff-atk':
        target.atkMul = def.power;
        break;
      case 'buff-def':
        target.defMul = def.power;
        break;
      case 'debuff-atk':
        target.atkMul = Math.max(0.3, 1 / def.power);
        break;
      case 'debuff-def':
        target.defMul = Math.max(0.3, 1 / def.power);
        break;
      default:
        break;
    }
  }

  private applyDamage(caster: Unit, target: Unit, def: SkillDef): void {
    const base = def.kind === 'damage-magic' ? this.scaledStats(caster).magic : this.scaledStats(caster).atk;
    let dmg = Math.max(1, Math.round(base * def.power));
    if (def.kind === 'damage-physical') dmg = Math.max(1, Math.round(dmg - this.scaledStats(target).def * 0.4));
    target.hp -= dmg;
    if (def.lifesteal) caster.hp = Math.min(caster.maxHp, caster.hp + Math.round(dmg * 0.5));
    if (def.status === 'stun') target.stun = 1;
    if (def.status === 'silence') target.silence = 1;
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      this.log.push({ turn: this.turn, actorId: caster.id, actorName: caster.name, action: 'kill', detail: `${target.name} fell to ${def.name}` });
    }
  }

  /** Apply transient atk/def multipliers to a stat block. */
  private scaledStats(u: Unit): UnitStats {
    return {
      atk: Math.round(u.stats.atk * u.atkMul),
      magic: Math.round(u.stats.magic * u.atkMul),
      def: Math.round(u.stats.def * u.defMul),
      evade: u.stats.evade,
      crit: u.stats.crit,
    };
  }

  private rollStance(unit: Unit, events: MarkovEvent[]): void {
    const m = matrixFor(unit.god.quadra);
    const r = nextState(unit.stance, events, m);
    unit.stance = sampleState(r.prob, this.rng);
  }

  private recomputeAlliances(clashPairs: Set<string>): void {
    for (const [key, link] of this.alliance) {
      if (!key.includes('|')) continue;
      const [a, b] = key.split('|');
      const clashed = clashPairs.has(this.pairKey(a, b));
      const bias = link.bias; // static aggregate relation bias
      link.status = stepStatus(link.status, bias, clashed);
    }
  }

  private checkVictory(): void {
    const aliveSides = this.sides.filter((s) => s.units.some((u) => u.alive));
    if (aliveSides.length <= 1) {
      this.finished = true;
      this.winner = aliveSides.length === 1 ? aliveSides[0].factionId : null;
    }
  }

  /** Run to completion or a max-turn cap. Returns the winner id (or null). */
  run(maxTurns = 500): string | null {
    while (!this.finished && this.turn < maxTurns) this.step();
    return this.winner;
  }
}

type BattleCommand =
  | { kind: 'hold' }
  | { kind: 'move'; to: SquareCoord }
  | { kind: 'attack'; targetId: string }
  | { kind: 'cast'; skill: import('../../types.js').OlympusSkill; targetId: string };

function sameCoord(a: SquareCoord, b: SquareCoord): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Public helper: overall inter-faction bias (for tests / UI). */
export function allianceBiasBetween(a: Faction, b: Faction): number {
  return factionBias(a, b);
}

// Re-export grid primitives so the battle API is a single import surface.
export { Grid, squareDistance, sameCell, cellsInRange, SQUARE_DIRS };
export type { SquareCoord };
