// Calendar export: tonight's planned tasks as back-to-back blocks from the next quarter hour, plus every
// deadline as an all-day event. Unverified or conflicting deadlines say so in the title.
import type {Plan} from './types';

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const day = (iso: string) => iso.slice(0, 10).replace(/-/g, '');
const esc = (s: string) => s.replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n');

export function buildIcs(plan: Plan, now = new Date()): string {
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(Math.ceil((start.getMinutes() + 1) / 15) * 15);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ResumeLoop//EN', 'CALSCALE:GREGORIAN'];
  let t = start.getTime();
  for (const id of plan.sequence) {
    const item = plan.items.find(i => i.id === id);
    if (!item?.minutes) continue;
    const end = t + item.minutes * 60000;
    lines.push('BEGIN:VEVENT', `UID:plan-${id}-${t}@resumeloop`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(new Date(t))}`, `DTEND:${stamp(new Date(end))}`,
      `SUMMARY:${esc('ResumeLoop: ' + item.title)}`, `DESCRIPTION:${esc(`${item.reason}. Source ${item.source_ref}, course version ${plan.version}.`)}`, 'END:VEVENT');
    t = end;
  }
  for (const item of plan.items.filter(i => i.due && i.state !== 'completed')) {
    const label = item.due_status === 'verified' ? 'Due' : item.due_status === 'conflict' ? 'Due (sources disagree, check)' : 'Due (unverified)';
    const next = new Date(Date.parse(item.due!.slice(0, 10)) + 86400000).toISOString();
    lines.push('BEGIN:VEVENT', `UID:due-${item.id}@resumeloop`, `DTSTAMP:${stamp(now)}`, `DTSTART;VALUE=DATE:${day(item.due!)}`, `DTEND;VALUE=DATE:${day(next)}`,
      `SUMMARY:${esc(`${label}: ${item.title}`)}`, `DESCRIPTION:${esc(`Deadline status: ${item.due_status}. Confirm with the coordinator before relying on it.`)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function downloadIcs(plan: Plan) {
  const url = URL.createObjectURL(new Blob([buildIcs(plan)], {type: 'text/calendar'}));
  const a = document.createElement('a');
  a.href = url; a.download = 'resumeloop-plan.ics'; a.click();
  URL.revokeObjectURL(url);
}
