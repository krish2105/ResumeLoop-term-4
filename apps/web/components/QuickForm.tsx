"use client";
// Small labelled form used by the studio editors. Server-side validation errors surface through
// the page's message line; required fields are checked here first so empty submits explain themselves.
import {useState} from 'react';

export type FieldSpec = {name: string; label: string; type?: 'text' | 'textarea' | 'select' | 'number' | 'date';
  options?: readonly (readonly [string, string])[]; placeholder?: string; wide?: boolean; required?: boolean; min?: number; max?: number};

export function QuickForm({id, fields, submitLabel, onSubmit, initial = {}}: {
  id: string; fields: FieldSpec[]; submitLabel: string; onSubmit: (v: Record<string, string>) => Promise<boolean>; initial?: Record<string, string>;
}) {
  const blank = () => Object.fromEntries(fields.map(f => [f.name, initial[f.name] ?? (f.type === 'select' ? f.options?.[0]?.[0] ?? '' : '')]));
  const [v, setV] = useState<Record<string, string>>(blank);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.filter(f => f.required && !v[f.name]?.trim()).map(f => f.label);
    if (missing.length) { setError('Fill in: ' + missing.join(', ')); return; }
    setError('');
    if (await onSubmit(v)) setV(blank());
  };
  return <form className="editor" onSubmit={submit} aria-describedby={id + '-err'} noValidate>
    <div className="formGrid">{fields.map(f => <label key={f.name} className={f.wide || f.type === 'textarea' ? 'wide' : ''}>{f.label}{f.required ? ' *' : ''}
      {f.type === 'textarea' ? <textarea rows={3} value={v[f.name]} placeholder={f.placeholder} onChange={e => setV({...v, [f.name]: e.target.value})} />
        : f.type === 'select' ? <select value={v[f.name]} onChange={e => setV({...v, [f.name]: e.target.value})}>{f.options!.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}</select>
        : <input type={f.type || 'text'} min={f.min} max={f.max} value={v[f.name]} placeholder={f.placeholder} onChange={e => setV({...v, [f.name]: e.target.value})} />}
    </label>)}</div>
    <p id={id + '-err'} className="fieldError" role="alert">{error}</p>
    <button className="primaryBtn" type="submit">{submitLabel}</button>
  </form>;
}

export const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
