"use client";
import {useCallback, useEffect, useState} from 'react';
import {ApiError} from '@/lib/client';
import {studio, type Item} from '@/lib/studio';

/** Loads every studio item once and exposes a refresh plus a shared message line. */
export function useStudio() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const refresh = useCallback(async () => {
    try { setItems(await studio.everything()); } catch (e) { setMsg(errorText(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setMsg('');
    try { await fn(); await refresh(); if (ok) setMsg(ok); return true; } catch (e) { setMsg(errorText(e)); return false; }
  };
  const of = (kind: string, parent?: string | null) => items.filter(i => i.kind === kind && (parent === undefined || i.parent_id === parent));
  return {items, of, loading, msg, setMsg, refresh, run};
}

export function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    const d = e.detail as {errors?: {field: string; message: string}[]} | undefined;
    const fields = d?.errors?.map(x => (x.field ? `${x.field}: ` : '') + x.message).join('; ');
    return fields ? `${e.message}. ${fields}` : e.message;
  }
  return e instanceof Error ? e.message : String(e);
}

export function Msg({text}: {text: string}) {
  return text ? <div className="toast" role="status">{text}</div> : null;
}

export function FictionBanner({items}: {items: Item[]}) {
  const fictional = items.some(i => i.synthetic);
  const real = items.some(i => i.kind === 'notes' && !i.synthetic);
  if (!fictional) return null;
  return <p className="fictionBanner" role="note"><strong>Fictional examples are loaded.</strong> They show how the studio works and are not research data.{real ? ' Your own notes are kept separate.' : ''}</p>;
}
