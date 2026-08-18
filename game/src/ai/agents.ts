/**
 * AI agent scaffolding — wraps the Olympus agent base (`olympus-*` skills) as
 * callable SkillHooks.
 *
 * Each god binds to one Olympus-Skill role, which in turn wraps one of the
 * seven base agent archetypes (zeus/athena/hermes-ag/hades/hera/apollo/hephaestus).
 * The SkillHook is what the game loop invokes on a decision tick; its default
 * implementation routes a context object through the bound agent and returns a
 * typed action. In the Hermes runtime the same agent id is summonable as
 * `olympus-<id>`; here we model the hook so it is testable without the runtime.
 */

import type {
  OlympianGod,
  OlympusSkill,
  SkillHook,
  SkillHookFactory,
} from '../types.js';
import { OLYMPIAN_REGISTRY } from '../data/gods.js';

/** A generic decision context handed to a skill hook. */
export interface SkillContext {
  /** Free-form state snapshot (e.g. faction resources, enemy positions). */
  readonly state: Readonly<Record<string, unknown>>;
  /** Current alliance status toward a target, if relevant. */
  readonly alliance?: 'WAR' | 'TRUCE' | 'PACT' | 'ALLIANCE';
  /** Optional target god id. */
  readonly target?: string;
}

/** The action a skill hook returns. */
export interface SkillResult {
  /** The god that produced the result. */
  readonly godId: string;
  /** The role that drove the decision. */
  readonly skill: OlympusSkill;
  /** Human-readable decision, e.g. "delegate fronts to Athena". */
  readonly decision: string;
  /** Structured payload for the engine to act on. */
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Default routing logic: turns a god + context into a decision string keyed
 * off the god's Olympus-Skill. This is the "AI agent" behavior the skill drives
 * (per OLYMPUS-GAME-DESIGN §4 table).
 */
function routeDecision(god: OlympianGod, ctx: SkillContext): SkillResult {
  const target = ctx.target ? (OLYMPIAN_REGISTRY[ctx.target]?.name ?? ctx.target) : 'the board';
  let decision: string;
  switch (god.olympusSkill) {
    case 'Orchestrator':
      decision = `Zeus allocates fronts and expands toward ${target}.`;
      break;
    case 'Tactician':
      decision = `Athena computes minimal-loss engagement vs ${target}.`;
      break;
    case 'Diplomacy':
      decision = `Hermes brokers / scouts ${target} across quadras.`;
      break;
    case 'Economy':
      decision = `Hades hoards and compounds toward a tipping point.`;
      break;
    case 'Order':
      decision = `Apollo harmonizes build-order and morale aura.`;
      break;
    case 'Festival':
      decision = `Dionysus triggers a feast economy burst.`;
      break;
    case 'Hearth':
      decision = `Hestia reinforces home-base regen and logistics.`;
      break;
    case 'Status':
      decision = `Hera enforces loyalty and punishes betrayal.`;
      break;
    case 'Line':
      decision = `Ares commits a rigid formation assault.`;
      break;
    case 'Seasonal':
      decision = `Persephone shifts bloom/underworld timing.`;
      break;
    case 'Expansion':
      decision = `Poseidon contests coastal city-claims.`;
      break;
    case 'Seduce':
      decision = `Aphrodite converts / intrigues ${target}.`;
      break;
    case 'Progress':
      decision = `Prometheus rushes tech for future payoff.`;
      break;
    case 'Forge':
      decision = `Hephaestus forges gear and a technological trap.`;
      break;
    case 'Wild':
      decision = `Artemis breaks enemy formations to protect the weak.`;
      break;
    case 'Sustain':
      decision = `Demeter sustains growth and tradition-locks economy.`;
      break;
    default:
      decision = `${god.name} acts.`;
  }
  return {
    godId: god.id,
    skill: god.olympusSkill,
    decision,
    payload: { agent: god.agent, quadra: god.quadra },
  };
}

/**
 * Build a SkillHook for a god. The hook captures the god and is callable:
 *   const hook = createSkillHook(god);
 *   const result = hook.invoke(ctx);
 */
export function createSkillHook(god: OlympianGod): SkillHook<SkillContext, SkillResult> {
  return {
    skill: god.olympusSkill,
    agent: god.agent,
    god,
    invoke(context: SkillContext): SkillResult {
      return routeDecision(god, context);
    },
  };
}

/**
 * The four named brief roles as direct factory constructors. Each returns a
 * SkillHook for the canonical god (Zeus/Athena/Hermes/Hades).
 */
export const Orchestrator: SkillHookFactory<SkillContext, SkillResult> = (god) =>
  createSkillHook(god);
export const Tactician: SkillHookFactory<SkillContext, SkillResult> = (god) =>
  createSkillHook(god);
export const Diplomat: SkillHookFactory<SkillContext, SkillResult> = (god) =>
  createSkillHook(god);
export const Economist: SkillHookFactory<SkillContext, SkillResult> = (god) =>
  createSkillHook(god);

/**
 * Assign a skill-driven behavior to a faction. Returns the per-god hooks the
 * module can invoke on decision ticks. (Public API surface.)
 */
export function assignBehavior(faction: {
  gods: readonly OlympianGod[];
}): SkillHook<SkillContext, SkillResult>[] {
  return faction.gods.map((g) => createSkillHook(g));
}
