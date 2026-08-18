/**
 * Headless Olympus battle simulation runner.
 *
 * Wires the data layer (factions, gods, relations) to the battle engine and
 * runs a full deterministic match between two or more god factions, printing a
 * compact headless report. This is the MVP "runnable simulation" the task asks
 * for; a future zero-rts renderer can consume `Battle.snapshot()` instead.
 *
 * Run with:  npx tsx src/sim.ts   (or compile + node)
 */

import { createFaction } from './index.js';
import { Battle } from './engine/battle/battle.js';

function printBanner(title: string): void {
  console.log('\n' + '='.repeat(64));
  console.log(title);
  console.log('='.repeat(64));
}

export function runMatch(factionIds: string[], seed = 0x1234): Battle {
  const factions = factionIds.map((id) => createFaction(id));
  printBanner(`OLYMPUS BATTLE — ${factions.map((f) => f.name).join(' vs ')}`);
  for (const f of factions) {
    console.log(`  ${f.name} [${f.quadra}] · ${f.gods.map((g) => g.name).join(', ')}`);
  }
  const battle = new Battle(factions, { cols: 12, rows: 12, seed });
  const winner = battle.run();
  printBanner('RESULT');
  if (winner) {
    const w = factions.find((f) => f.id === winner);
    console.log(`  Winner: ${w?.name ?? winner} (${battle.turn} turns)`);
  } else {
    console.log(`  Stalemate after ${battle.turn} turns — no faction eliminated.`);
  }
  // Survivor summary
  const survivors = battle.snapshot().units.filter((u) => u.alive);
  console.log(`  Survivors: ${survivors.length}/${battle.snapshot().units.length}`);
  for (const f of factions) {
    const side = battle.sides.find((s) => s.factionId === f.id);
    const alive = side?.units.filter((u) => u.alive).map((u) => u.name) ?? [];
    console.log(`   - ${f.name}: ${alive.length ? alive.join(', ') : '(wiped out)'}`);
  }
  // Sample of the action log (first 12 + last 8 lines)
  const log = battle.log;
  console.log(`\n  Action log (${log.length} entries; showing first 12 + last 8):`);
  const head = log.slice(0, 12);
  const tail = log.slice(-8);
  for (const e of head) console.log(`   [${e.turn}] ${e.actorName} ${e.action}: ${e.detail}`);
  if (log.length > 20) console.log('   …');
  for (const e of tail) console.log(`   [${e.turn}] ${e.actorName} ${e.action}: ${e.detail}`);
  return battle;
}

// Execute when run directly under Node. Scoped `process` declaration avoids a
// hard dependency on @types/node in the (DOM-targeted) project typecheck.
declare const process: { argv: readonly string[] } | undefined;
const isMain =
  typeof process !== 'undefined' &&
  !!process.argv[1] &&
  process.argv[1].endsWith('sim.ts');
if (isMain) {
  const ids = process.argv.slice(2);
  const chosen = ids.length >= 2 ? ids : ['warhost', 'underworld-syndicate'];
  runMatch(chosen);
}
