"use client";
import {useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {Msg, useStudio} from '@/components/StudioBits';
import {studio, type Item} from '@/lib/studio';

export default function SynthesisPage() {
  const s = useStudio();
  const notes = s.of('notes');
  const themes = s.of('themes');
  const codes = s.of('codes').filter(c => c.status === 'accepted');
  const povs = s.of('povs');
  const personas = s.of('personas');
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const owner = (c: Item) => notes.find(n => n.id === c.parent_id);
  const move = (codeId: string, themeId: string | null) => s.run(() => studio.update('codes', codeId, {theme_id: themeId}));
  const columns: [string | null, string, Item[]][] = [[null, 'Unsorted', codes.filter(c => !c.theme_id || !themes.some(t => t.id === c.theme_id))],
    ...themes.map(t => [t.id, t.title, codes.filter(c => c.theme_id === t.id)] as [string, string, Item[]])];
  const checks: [boolean, string][] = [
    [codes.length > 0 && codes.every(c => c.theme_id), `Every accepted code sits in a theme (${codes.filter(c => !c.theme_id).length} unsorted)`],
    [themes.length > 0 && themes.every(t => codes.some(c => c.theme_id === t.id)), `Every theme has supporting codes (${themes.filter(t => !codes.some(c => c.theme_id === t.id)).length} empty)`],
    [themes.every(t => new Set(codes.filter(c => c.theme_id === t.id).map(c => owner(c)?.participant_code)).size >= 2), 'Each theme draws on at least two participants (not one loud voice)'],
    [povs.length > 0 && povs.every(p => p.theme_id), `Every point-of-view statement links to a theme (${povs.filter(p => !p.theme_id).length} unlinked)`],
    [personas.every(p => p.evidence_ids?.length), `Every persona is backed by evidence (${personas.filter(p => !p.evidence_ids?.length).length} assumptions)`],
    [!codes.some(c => owner(c)?.synthetic), 'No fictional examples are mixed into themes'],
  ];
  return <>
    <PageHead art="stop-define" eyebrow="Design studio · weeks 4–5, synthesis" title="Synthesis board" intro="Cluster accepted codes into themes by dragging cards, or use the Move menu on each card. The trace below shows every theme back to its quotes and participants, so each claim in your report is defensible." />
    <Msg text={s.msg} />
    <section className="panel" aria-labelledby="aff-h">
      <h2 id="aff-h">Affinity board ({codes.length} accepted codes)</h2>
      {codes.length === 0 && <p className="empty">Accept codes in the Empathy studio first.</p>}
      <div className="affinity">{columns.map(([id, title, list]) => <div key={id ?? 'none'} className={'affCol' + (over === (id ?? 'none') ? ' over' : '')}
        onDragOver={e => { e.preventDefault(); setOver(id ?? 'none'); }} onDragLeave={() => setOver(null)}
        onDrop={e => { e.preventDefault(); setOver(null); if (drag) move(drag, id); setDrag(null); }} aria-label={`${title}, ${list.length} codes`} role="group">
        <h3>{title} <span className="tag">{list.length}</span></h3>
        {list.map(c => <article key={c.id} className="affCard" draggable onDragStart={() => setDrag(c.id)} onDragEnd={() => setDrag(null)}>
          <span className={'cat ' + c.category}>{c.category}</span> <strong>{c.label}</strong>
          <blockquote>“{c.quote}”</blockquote>
          <p className="meta">{owner(c)?.participant_code || '?'}{owner(c)?.synthetic ? ' · fictional' : ''}</p>
          <label className="sr-only" htmlFor={'mv' + c.id}>Move {c.label} to</label>
          <select id={'mv' + c.id} value={c.theme_id || ''} onChange={e => move(c.id, e.target.value || null)}><option value="">Unsorted</option>{themes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
        </article>)}
      </div>)}</div>
    </section>
    <div className="twoCol sectionGap">
      <section className="panel" aria-labelledby="tr-h">
        <h2 id="tr-h">Evidence trace</h2>
        {themes.length === 0 && <p className="empty">Create themes in the Empathy studio.</p>}
        <ul className="traceTree">{themes.map(t => { const cs = codes.filter(c => c.theme_id === t.id); const ps = [...new Set(cs.map(c => owner(c)?.participant_code).filter(Boolean))];
          return <li key={t.id}><strong>{t.title}</strong> <span className="meta">{cs.length} codes · {ps.length} participants ({ps.join(', ') || 'none'})</span>
            {t.insight && <p>{t.insight}</p>}
            <ul>{cs.map(c => <li key={c.id}><span className={'cat ' + c.category}>{c.category}</span> “{c.quote}” <span className="meta">{owner(c)?.participant_code}</span></li>)}</ul>
            {povs.filter(p => p.theme_id === t.id).map(p => <p key={p.id} className="povLine">→ POV: {p.user} needs a way to {p.need} because {p.insight}</p>)}
          </li>; })}</ul>
      </section>
      <section className="panel" aria-labelledby="q-h">
        <h2 id="q-h">Evidence quality</h2>
        <p>A professor will ask "how do you know?". These checks are what makes the answer easy.</p>
        <ul className="checkList">{checks.map(([ok, label]) => <li key={label}><span className={'tag ' + (ok ? 'ok' : 'warn')}>{ok ? 'pass' : 'to do'}</span><div>{label}</div><span /></li>)}</ul>
        <p className="mono muted">{checks.filter(c => c[0]).length}/{checks.length} checks pass</p>
      </section>
    </div>
  </>;
}
