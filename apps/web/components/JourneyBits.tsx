"use client";
import type {SaveState} from '@/lib/useJourney';

export function SaveBadge({state, onReload}: {state: SaveState; onReload: () => void}) {
  if (state === 'conflict') return <span className="saveBadge conflict" role="alert">Changed in another tab <button className="textBtn" onClick={onReload}>Reload</button></span>;
  const text = {idle: 'Progress loaded', saving: 'Saving…', saved: 'Saved', error: 'Not saved, check the API'}[state];
  return <span className={'saveBadge ' + state} role="status">{text}</span>;
}

export function Warnings({warnings}: {warnings: string[]}) {
  if (!warnings.length) return null;
  return <ul className="warnings" aria-label="Plan warnings">{warnings.map(w => <li key={w}>{w}</li>)}</ul>;
}
