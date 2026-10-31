// Quick check of the calendar export: run with `node scripts/ics-check.ts`.
import {buildIcs} from '../lib/ics.ts';
const plan = {version: 'v2', sequence: ['a'], items: [
  {id: 'a', title: 'Recap, part 1', minutes: 15, reason: 'Earliest', source_ref: 'S1', state: 'planned', due: null, due_status: 'none'},
  {id: 'q', title: 'Quiz', minutes: 10, reason: '', source_ref: 'S3', state: 'locked', due: '2026-11-26T18:00:00+04:00', due_status: 'conflict'}]};
const ics = buildIcs(plan as never, new Date('2026-11-10T10:07:00Z'));
const ok = ics.includes('DTSTART:20261110T101500Z') && ics.includes('DTEND:20261110T103000Z') && ics.includes('Recap\\, part 1')
  && ics.includes('Due (sources disagree\\, check): Quiz') && ics.includes('DTSTART;VALUE=DATE:20261126') && ics.endsWith('END:VCALENDAR\r\n');
console.log(ok ? 'ics ok' : ics);
process.exit(ok ? 0 : 1);
