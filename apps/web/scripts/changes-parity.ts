// Checks the browser pilot's change diff and wording against the Python output stored in the fixtures.
// Run: node scripts/changes-parity.ts
import {readFileSync} from 'node:fs';
import {describe, diffVersions} from '../lib/changes.ts';

const fixtures = JSON.parse(readFileSync(new URL('../demo/fixtures.json', import.meta.url), 'utf8'));
const changes = diffVersions(fixtures.courses.v1.actions, fixtures.courses.v2.actions);
const sameDiff = JSON.stringify(changes) === JSON.stringify(fixtures.diff.changes.map(({source_type, ...c}: Record<string, unknown>) => c));
const facts = fixtures.recorded_ai.digest.facts as {id: string; fact: string}[];
const wording = facts.filter(f => describe(changes.find(c => c.id === f.id)!) !== f.fact);
if (!sameDiff) console.error('diff differs', {python: fixtures.diff.changes, typescript: changes});
for (const f of wording) console.error('wording differs', f.id, {python: f.fact, typescript: describe(changes.find(c => c.id === f.id)!)});
console.log(`${sameDiff ? 'diff matches' : 'diff DIFFERS'}; ${facts.length - wording.length}/${facts.length} change descriptions match`);
process.exit(sameDiff && !wording.length ? 0 : 1);
