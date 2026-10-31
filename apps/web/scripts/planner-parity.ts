// Checks the TypeScript demo planner against plans produced by the Python planner.
// Run: node scripts/planner-parity.ts   (Node 23.6+ strips types natively)
import {readFileSync} from 'node:fs';
import {buildPlan} from '../lib/planner.ts';

const fixtures = JSON.parse(readFileSync(new URL('../demo/fixtures.json', import.meta.url), 'utf8'));
let failures = 0;
for (const [i, c] of fixtures.planner_parity.entries()) {
  const plan = buildPlan(fixtures.courses[c.version].actions, c.budget, new Set(c.completed));
  const states = Object.fromEntries(plan.items.map(item => [item.id, item.state]));
  const same = JSON.stringify(plan.sequence) === JSON.stringify(c.sequence)
    && JSON.stringify(plan.warnings) === JSON.stringify(c.warnings)
    && JSON.stringify(states) === JSON.stringify(c.states);
  if (!same) { failures++; console.error(`case ${i} differs`, {expected: c.sequence, got: plan.sequence}); }
}
console.log(`${fixtures.planner_parity.length - failures}/${fixtures.planner_parity.length} planner parity cases match`);
process.exit(failures ? 1 : 0);
