import type {RoadNode} from '@/components/NightRoad';
import type {Plan} from './types';

/** Road order: what you finished, then tonight's plan in sequence, then everything still ahead. */
export function roadNodes(plan: Plan): RoadNode[] {
  const byId = new Map(plan.items.map(i => [i.id, i]));
  const done = plan.items.filter(i => i.state === 'completed');
  const planned = plan.sequence.map(id => byId.get(id)!).filter(Boolean);
  const rest = plan.items.filter(i => i.state !== 'completed' && !plan.sequence.includes(i.id));
  return [...done, ...planned, ...rest].map(i => ({
    id: i.id, title: i.title, minutes: i.minutes, prerequisites: i.prerequisites,
    state: i.id === plan.next_action ? 'next' : i.state,
  }));
}

export const STATE_LABEL: Record<string, string> = {
  completed: 'Completed', next: 'Next', planned: 'Planned', locked: 'Locked', 'does-not-fit': 'Does not fit', abstained: 'Not scheduled',
};

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch { return false; }
}
