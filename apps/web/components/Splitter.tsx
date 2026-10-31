"use client";
// WAI-ARIA window splitter: drag with a pointer, or focus and use arrow keys, Home/End;
// Enter collapses or restores; double-click resets. Width persists per key in localStorage.
import {useCallback, useEffect, useRef, useState} from 'react';

export function useResizable(key: string, {initial, min, max, edge}: {initial: number; min: number; max: number; edge: 'left' | 'right'}) {
  const [size, setSize] = useState(initial);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rl-size-' + key) || 'null');
      if (saved && typeof saved.size === 'number') { setSize(Math.min(max, Math.max(min, saved.size))); setCollapsed(!!saved.collapsed); }
    } catch { /* ignore */ }
  }, [key, min, max]);
  useEffect(() => { try { localStorage.setItem('rl-size-' + key, JSON.stringify({size, collapsed})); } catch { /* ignore */ } }, [key, size, collapsed]);
  const clamp = useCallback((n: number) => Math.min(max, Math.max(min, Math.round(n))), [min, max]);
  return {size, collapsed, setCollapsed, setSize: (n: number) => setSize(clamp(n)), clamp, min, max, initial, edge};
}

type R = ReturnType<typeof useResizable>;

export function Splitter({r, label, controls}: {r: R; label: string; controls: string}) {
  const start = useRef<{x: number; size: number} | null>(null);
  const [dragging, setDragging] = useState(false);
  const sign = r.edge === 'left' ? 1 : -1; // left panel grows when dragging right
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    start.current = {x: e.clientX, size: r.collapsed ? r.min : r.size};
    r.setCollapsed(false); setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    r.setSize(start.current.size + sign * (e.clientX - start.current.x));
  };
  const end = () => { start.current = null; setDragging(false); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 48 : 16;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); r.setCollapsed(false); r.setSize(r.size + (e.key === 'ArrowRight' ? 1 : -1) * sign * step); }
    if (e.key === 'Home') { e.preventDefault(); r.setSize(r.min); }
    if (e.key === 'End') { e.preventDefault(); r.setSize(r.max); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r.setCollapsed(!r.collapsed); }
  };
  return <div role="separator" aria-orientation="vertical" aria-label={label} aria-controls={controls} tabIndex={0}
    aria-valuemin={r.min} aria-valuemax={r.max} aria-valuenow={r.collapsed ? 0 : r.size} aria-valuetext={r.collapsed ? 'Collapsed' : `${r.size} pixels wide`}
    className={'splitter' + (dragging ? ' dragging' : '')} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end}
    onDoubleClick={() => { r.setCollapsed(false); r.setSize(r.initial); }} onKeyDown={onKeyDown} title="Drag to resize · Enter to collapse · double-click to reset">
    <span className="splitterGrip" aria-hidden="true" />
  </div>;
}
