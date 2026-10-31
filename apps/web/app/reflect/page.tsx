"use client";
import {useEffect, useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {words} from '@/components/QuickForm';
import {Msg, useStudio} from '@/components/StudioBits';
import {studio, type Item} from '@/lib/studio';

// The three prompts follow the unit outline's indicative reflective-paper template (§3.5).
const PROMPTS = [
  ['explanation', 'The concept, in your own words', 'Which topic, concept or theory interested you most, and what does it mean?'],
  ['organisation_value', 'Why it matters to an organisation', 'How could using it help an organisation achieve its objectives?'],
  ['example', 'A detailed, practical example', 'How could a specific organisation use it to improve what it does today?'],
] as const;
type Draft = {entry_date: string; concept: string; explanation: string; organisation_value: string; example: string; ai_assistance: string; ai_note: string};
const today = () => new Date().toISOString().slice(0, 10);
const empty = (): Draft => ({entry_date: today(), concept: '', explanation: '', organisation_value: '', example: '', ai_assistance: 'none', ai_note: ''});

export default function ReflectPage() {
  const s = useStudio();
  const entries = [...s.of('reflections')].sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
  const [d, setD] = useState<Draft>(empty);
  const [restored, setRestored] = useState(false);
  useEffect(() => { try { const x = localStorage.getItem('rl-reflection-draft'); if (x) { setD(JSON.parse(x)); setRestored(true); } } catch { /* ignore */ } }, []);
  useEffect(() => { try { localStorage.setItem('rl-reflection-draft', JSON.stringify(d)); } catch { /* ignore */ } }, [d]);
  const total = words(d.explanation) + words(d.organisation_value) + words(d.example);
  const save = () => s.run(() => studio.create('reflections', d), 'Entry saved.').then(ok => { if (ok) { setD(empty()); setRestored(false); try { localStorage.removeItem('rl-reflection-draft'); } catch { /* ignore */ } } });
  const exportMd = () => {
    const md = entries.slice().reverse().map((e: Item) => `## ${e.entry_date} · ${e.concept}\n\n### The concept\n${e.explanation}\n\n### Why it matters to an organisation\n${e.organisation_value}\n\n### Practical example\n${e.example}\n\n_AI assistance: ${e.ai_assistance}${e.ai_note ? ` (${e.ai_note})` : ''}_\n`).join('\n');
    const url = URL.createObjectURL(new Blob([`# Reflection journal\n\n${md}`], {type: 'text/markdown'}));
    const a = document.createElement('a'); a.href = url; a.download = 'reflection-journal.md'; a.click(); URL.revokeObjectURL(url);
  };
  return <>
    <PageHead eyebrow="Present and reflect · reflective paper, 40%" title="Reflection journal" intro="Dated, first-person entries in the outline's three-part structure. ResumeLoop never writes these for you: they are your evidence of learning, in your own words.">
      <button className="outlineBtn" onClick={exportMd} disabled={!entries.length}>Download as Markdown</button>
    </PageHead>
    <Msg text={s.msg} />
    <section className="panel" aria-labelledby="new-r">
      <h2 id="new-r">New entry</h2>{restored && <p className="muted" role="status">Draft restored on this device.</p>}
      <div className="formGrid">
        <label>Date<input type="date" value={d.entry_date} onChange={e => setD({...d, entry_date: e.target.value})} /></label>
        <label>Concept or framework *<input value={d.concept} onChange={e => setD({...d, concept: e.target.value})} placeholder="Extreme users" /></label>
      </div>
      {PROMPTS.map(([k, title, hint]) => <div key={k}><p className="q">{title}</p><label className="sr-only" htmlFor={'r-' + k}>{title}</label>
        <textarea id={'r-' + k} rows={5} value={d[k]} onChange={e => setD({...d, [k]: e.target.value})} placeholder={hint} /><span className="wordCount">{words(d[k])} words</span></div>)}
      <fieldset className="consent"><legend>Disclose any AI assistance</legend>
        <label className="checkRow"><input type="radio" name="ai" checked={d.ai_assistance === 'none'} onChange={() => setD({...d, ai_assistance: 'none'})} /> None</label>
        <label className="checkRow"><input type="radio" name="ai" checked={d.ai_assistance === 'spelling-only'} onChange={() => setD({...d, ai_assistance: 'spelling-only'})} /> Spelling and grammar only</label>
        <label className="checkRow"><input type="radio" name="ai" checked={d.ai_assistance === 'other'} onChange={() => setD({...d, ai_assistance: 'other'})} /> Other (describe)</label>
        {d.ai_assistance === 'other' && <input aria-label="Describe the AI assistance" value={d.ai_note} onChange={e => setD({...d, ai_note: e.target.value})} />}
      </fieldset>
      <p className="muted"><span className="mono">{total}</span> words in this entry. The outline does not set a length; check with faculty.</p>
      <button className="primaryBtn" onClick={save} disabled={d.concept.trim().length < 3}>Save entry</button>
    </section>
    <section className="sectionGap" aria-label="Entries">{entries.map(e => <article key={e.id} className="entry sectionGap">
      <div className="sectionHead"><div><span className="eyebrow mono">{e.entry_date}</span><h3>{e.concept}</h3></div>
        <button className="textBtn" onClick={() => s.run(() => studio.remove('reflections', e.id), 'Entry deleted.')}>Delete</button></div>
      {PROMPTS.map(([k, title]) => e[k] ? <div key={k}><p className="q">{title}</p><p>{e[k]}</p></div> : null)}
      <p className="meta">AI assistance: {e.ai_assistance}{e.ai_note ? ` (${e.ai_note})` : ''}</p></article>)}
      {entries.length === 0 && <p className="empty">No entries yet. Write one after each session while it is fresh.</p>}</section>
  </>;
}
