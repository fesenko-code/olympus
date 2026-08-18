/**
 * Olympus game — core type definitions.
 *
 * A god is a pure data record, never a script (data-as-design, per the
 * sociotype-game-design framework). Faction archetypes derive from the god's
 * Socionics TIM + quadra. AI behavior is a *binding* to an Olympus agent
 * archetype (the `olympus-*` skills), expressed here as a callable SkillHook.
 *
 * Strict TS: no `any`, no unused locals/params.
 */

/** The four Socionics quadras (rock-paper-scissors ring, no strongest). */
export type Quadra = 'ALPHA' | 'BETA' | 'GAMMA' | 'DELTA';

/**
 * Communicating-vessels stat axes. Each pair sums to 100, so you can never
 * max both poles — built-in anti-overpowered guard.
 */
export interface Axis {
  /** Energy: Extraversion vs Introversion. E + I === 100. */
  E: number;
  I: number;
  /** Power source: Sensing/Strength vs iNtuition/Magic. S + N === 100. */
  S: number;
  N: number;
  /** Decision: Thinking/Tactics vs Feeling/Ethics. T + F === 100. */
  T: number;
  F: number;
  /** Battle dynamics: Judging/stability vs Perceiving/adaptivity. J + P === 100. */
  J: number;
  P: number;
}

/** Socionics TIM codes (international notation) used by the Olympus base. */
export type TimCode =
  | 'ESTp' // SLE  — Жуков
  | 'ESTj' // LSE  — Штірліц
  | 'ENTp' // ILE  — Дон Кіхот
  | 'INTp' // ILI  — Бальзак
  | 'ENFj' // EIE  — Гамлет
  | 'INTj' // LII  — Робесп'єр
  | 'ISTp' // SLI  — Габен
  | 'ESFj' // ESE  — Гюго
  | 'ISFp' // SEI  — Дюма
  | 'ISTj' // LSI  — Максим Горький
  | 'INFp' // IEI  — Єсенін
  | 'ESFp' // SEE  — Наполеон
  | 'ISFj' // ESI  — Драйзер
  | 'ENTj' // LIE  — Джек Лондон
  | 'ENFp' // ENE  — Гекслі
  | 'INFj'; // EII  — Достоєвський

/**
 * Intertype relations (Socionics). Each relation becomes a numeric modifier on
 * the alliance/war layer in `engine/relations.ts`.
 */
export type RelationKind =
  | 'dual' // perfect complement — alliance anchor
  | 'activation' // mutual recharge, pact survives conflict
  | 'semi-dual' // conditional buff, decays out of context
  | 'conflict' // one dominates in its sphere
  | 'extinguish' // opposite worldview — doomed alliance
  | 'mirror' // same-quadra rivalry, not open war
  | 'cross-quadra' // ideological war / cross-quadra tension
  | 'neutral'; // no fixed relation (spy axis)

/** Markov battle-stance states (reused from quadra-tactics markov engine). */
export type MarkovState = 'N_MAGIC' | 'T_TACTICS' | 'S_SHADOW' | 'IDLE';

/**
 * Olympus-Skill — the AI agent role a god binds to. The first four are the
 * named roles from the task brief; the rest extend the full 16-god pantheon.
 * Each maps 1:1 onto an `olympus-*` agent archetype in the base repo.
 */
export type OlympusSkill =
  // Brief-named core roles
  | 'Orchestrator' // Zeus  → olympus-zeus
  | 'Tactician' // Athena→ olympus-athena
  | 'Diplomacy' // Hermes→ olympus-hermes-ag
  | 'Economy' // Hades → olympus-hades
  // Extended pantheon roles
  | 'Order' // Apollo→ olympus-apollo
  | 'Festival' // Dionysus
  | 'Hearth' // Hestia
  | 'Status' // Hera  → olympus-hera (guardian/validator)
  | 'Line' // Ares
  | 'Seasonal' // Persephone
  | 'Expansion' // Poseidon
  | 'Seduce' // Aphrodite
  | 'Progress' // Prometheus
  | 'Forge' // Hephaestus → olympus-hephaestus
  | 'Wild' // Artemis
  | 'Sustain'; // Demeter

/** The Olympus agent archetype (base repo `olympus-*` skill) a god binds to. */
export type OlympusAgentId =
  | 'zeus'
  | 'athena'
  | 'hermes-ag'
  | 'hades'
  | 'hera'
  | 'apollo'
  | 'hephaestus';

/** Faction archetype that falls out of a quadra's god-values. */
export type FactionArchetype =
  | 'EnlightenmentCourt' // ALPHA — science, trade, revelry
  | 'Warhost' // BETA  — conquest, order, status
  | 'UnderworldSyndicate' // GAMMA — economy, ambition, long game
  | 'Craftwardens'; // DELTA — defense, craft, duty

/** Canonical Olympian identity + Socionics + mechanics signature. */
export interface OlympianGod {
  /** Stable id, e.g. 'zeus'. */
  id: string;
  /** Display name, e.g. 'Zeus'. */
  name: string;
  /** Socionics nickname (Ukrainian / Щокін), e.g. "СЛЕ «Жуков»". */
  tim: string;
  /** International TIM code. */
  code: TimCode;
  /** Quadra this god belongs to. */
  quadra: Quadra;
  /** Communicating-vessels stats (each pair sums to 100). */
  axes: Axis;
  /** Faction archetype derived from the quadra. */
  factionArchetype: FactionArchetype;
  /** AI role binding. */
  olympusSkill: OlympusSkill;
  /** Base Olympus agent this god wraps (the `olympus-*` skill). */
  agent: OlympusAgentId;
  /** Markov stance bias per quadra. */
  markovBias: { dominant: MarkovState; shadow: MarkovState };
  /**
   * Explicit pairwise relations to other gods. Unspecified pairs are resolved
   * by quadra-derivation in `relationBetween` (never `undefined`).
   */
  relations: Partial<Record<string, RelationKind>>;
}

/** A faction instance a module can instantiate and assign behaviors to. */
export interface Faction {
  id: string;
  name: string;
  quadra: Quadra;
  archetype: FactionArchetype;
  /** Lead god(s) of the faction. */
  gods: OlympianGod[];
}

/** Alliance state-machine status (Markov-flavored, per design spec §3.1). */
export type AllianceStatus = 'WAR' | 'TRUCE' | 'PACT' | 'ALLIANCE';

/**
 * A callable hook that drives a god's behavior. Wraps the Olympus agent
 * archetype: the factory receives the god + a context object and returns a
 * function the game loop can invoke (e.g. on a decision tick).
 */
export interface SkillHook<C = unknown, R = unknown> {
  readonly skill: OlympusSkill;
  readonly agent: OlympusAgentId;
  /** The god this hook was built for. */
  readonly god: OlympianGod;
  /** Invoke the skill with a context; returns a result. */
  invoke(context: C): R;
}

/** Factory that builds a SkillHook for a god. */
export type SkillHookFactory<C = unknown, R = unknown> = (
  god: OlympianGod,
) => SkillHook<C, R>;
