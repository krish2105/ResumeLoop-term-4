"use client";
import Link from 'next/link';
import {useEffect, useState} from 'react';
import {AiBadge} from '@/components/AiBadge';
import {PageHead} from '@/components/AppShell';
import {CrazyEights} from '@/components/CrazyEights';
import {Msg, useStudio} from '@/components/StudioBits';
import {ALTERNATIVES, CRITERIA, studio} from '@/lib/studio';

export default function IdeatePage() {
  const s = useStudio();
  const themes = s.of('themes');
  const [name, setName] = useState('');
  useEffect(() => { try { setName(localStorage.getItem('rl-name') || ''); } catch { /* ignore */ } }, []);
  const saveName = (n: string) => { setName(n); try { localStorage.setItem('rl-name', n); } catch { /* ignore */ } };
  const [hmwText, setHmwText] = useState<Record<string, string>>({});
  const [suggested, setSuggested] = useState<Record<string, {questions: string[]; mode: string; model: string | null; recorded_at?: string}>>({});
  const [busy, setBusy] = useState('');
  const [idea, setIdea] = useState<Record<string, {title: string; alternative: string}>>({});
  const who = name.trim() || 'Anonymous';
  const suggest = async (themeId: string, insight: string) => {
    setBusy(themeId);
    await s.run(async () => { const r = await studio.suggestHmw(themeId, insight); setSuggested(x => ({...x, [themeId]: r})); });
    setBusy('');
  };
  const scores = s.of('scores');
  const avg = (alt: string, crit: string) => { const v = scores.filter(x => x.alternative === alt && x.criterion === crit).map(x => x.value as number); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '—'; };
  const mine = (alt: string, crit: string) => scores.find(x => x.alternative === alt && x.criterion === crit && x.scorer === who)?.value ?? '';
  const total = (alt: string) => { const v = scores.filter(x => x.alternative === alt).map(x => x.value as number); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : '—'; };
  return <>
    <PageHead eyebrow="Design studio · weeks 6–7" title="Ideate" intro="Reframe themes as How might we questions, generate ideas, vote, and compare three real alternatives. The alternatives deliberately include options that are not ResumeLoop.">
      <label className="nameField">Your name for votes and scores<input value={name} onChange={e => saveName(e.target.value)} placeholder="Optional" /></label>
    </PageHead>
    <Msg text={s.msg} />
    <CrazyEights run={s.run} sprints={s.of('sprints') as never} />
    {!s.loading && themes.length === 0 && <section className="panel"><h2>No themes yet</h2><p>Create themes from accepted codes in the <Link href="/studio/empathy">Empathy studio</Link> first.</p></section>}
    {themes.map(t => {
      const hmws = s.of('hmw', t.id);
      const sug = suggested[t.id];
      return <section key={t.id} className="panel themeBlock" aria-label={`Theme ${t.title}`}>
        <span className="eyebrow">Theme</span><h2>{t.title}</h2><p>{t.insight}</p>
        <div className="detailActions"><button className="outlineBtn" disabled={busy === t.id || !t.insight} onClick={() => suggest(t.id, t.insight)}>{busy === t.id ? 'Thinking…' : 'Suggest How might we questions'}</button></div>
        {sug && <div className="suggestBox"><AiBadge mode={sug.mode} model={sug.model} recordedAt={sug.recorded_at} />
          {sug.questions.length === 0 ? <p className="muted">No usable suggestions. Write your own below.</p> :
            <ul>{sug.questions.map(q => <li key={q}>{q} <button className="textBtn" onClick={() => s.run(() => studio.create('hmw', {question: q, origin: 'ai', contributor: name || null}, t.id), 'Added.')}>Add</button></li>)}</ul>}</div>}
        <div className="askForm"><label htmlFor={'h-' + t.id} className="sr-only">New How might we question</label>
          <input id={'h-' + t.id} value={hmwText[t.id] || ''} onChange={e => setHmwText(x => ({...x, [t.id]: e.target.value}))} placeholder="How might we…" />
          <button className="primaryBtn" onClick={() => s.run(() => studio.create('hmw', {question: hmwText[t.id] || '', origin: 'human', contributor: name || null}, t.id), 'Question added.').then(ok => ok && setHmwText(x => ({...x, [t.id]: ''})))}>Add</button></div>
        <ol className="hmwList">{hmws.map(h => {
          const ideas = s.of('ideas', h.id);
          const draft = idea[h.id] || {title: '', alternative: 'resumeloop'};
          return <li key={h.id}><strong>{h.question}</strong> <small className="muted">{h.origin === 'ai' ? 'AI suggestion, added by a person' : 'written by a person'}{h.contributor ? ` · ${h.contributor}` : ''}</small>
            <ul className="ideaList">{ideas.sort((a, b) => s.of('votes', b.id).length - s.of('votes', a.id).length).map(i => {
              const votes = s.of('votes', i.id);
              const voted = votes.some(v => v.voter === who);
              return <li key={i.id}><span><strong>{i.title}</strong> <span className="chip">{ALTERNATIVES.find(a => a[0] === i.alternative)?.[1] || 'Other'}</span></span>
                <span className="rowActions"><span className="voteCount">{votes.length} vote{votes.length === 1 ? '' : 's'}</span>
                  <button className="outlineBtn" disabled={voted} onClick={() => s.run(() => studio.create('votes', {voter: who}, i.id))}>{voted ? 'Voted' : 'Vote'}</button></span></li>;
            })}</ul>
            <div className="askForm"><label htmlFor={'i-' + h.id} className="sr-only">New idea</label>
              <input id={'i-' + h.id} value={draft.title} onChange={e => setIdea(x => ({...x, [h.id]: {...draft, title: e.target.value}}))} placeholder="An idea" />
              <select aria-label="Alternative" value={draft.alternative} onChange={e => setIdea(x => ({...x, [h.id]: {...draft, alternative: e.target.value}}))}>{ALTERNATIVES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}<option value="other">Other</option></select>
              <button className="outlineBtn" onClick={() => s.run(() => studio.create('ideas', {title: draft.title, alternative: draft.alternative, contributor: name || null}, h.id), 'Idea added.').then(ok => ok && setIdea(x => ({...x, [h.id]: {title: '', alternative: draft.alternative}})))}>Add idea</button></div>
          </li>;
        })}</ol>
      </section>;
    })}
    <section className="panel" aria-labelledby="alt-h">
      <h2 id="alt-h">Compare the alternatives</h2>
      <p>Score each option from 1 (poor) to 5 (strong). Everyone's scores are averaged. A better LMS checklist winning is a valid result.</p>
      <div className="tableWrap" role="region" tabIndex={0} aria-label="Alternative scores, scroll horizontally for all columns"><table><thead><tr><th>Criterion</th>{ALTERNATIVES.map(([v, l]) => <th key={v}>{l}</th>)}</tr></thead><tbody>
        {CRITERIA.map(c => <tr key={c}><td>{c}</td>{ALTERNATIVES.map(([v]) => <td key={v}>
          <select aria-label={`${c} score for ${v}`} value={mine(v, c)} onChange={e => e.target.value && s.run(() => studio.create('scores', {alternative: v, criterion: c, value: Number(e.target.value), scorer: who}))}>
            <option value="">—</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select> <small className="muted">avg {avg(v, c)}</small></td>)}</tr>)}
        <tr><td><strong>Overall average</strong></td>{ALTERNATIVES.map(([v]) => <td key={v}><strong>{total(v)}</strong></td>)}</tr>
      </tbody></table></div>
      <p className="muted">{new Set(scores.map(x => x.scorer)).size} scorer(s). Scores are opinions from your group, not measurements.</p>
    </section>
  </>;
}
