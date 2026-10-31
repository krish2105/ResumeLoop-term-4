"use client";
import Link from 'next/link';
import {useEffect, useState} from 'react';
import {useStudio} from '@/components/StudioBits';
import {computeCounts, STOPS} from '@/lib/story';
import {useJourney} from '@/lib/useJourney';

/** Week 12 slide deck generated from story mode: one 16:9 slide per stop, printable to PDF. */
export default function DeckPage() {
  const s = useStudio();
  const j = useJourney();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [presenters, setPresenters] = useState<Record<string, string>>({});
  const [showNotes, setShowNotes] = useState(true);
  useEffect(() => { try { setNotes(JSON.parse(localStorage.getItem('rl-presenter-notes') || '{}')); setPresenters(JSON.parse(localStorage.getItem('rl-presenters') || '{}')); } catch { /* ignore */ } }, []);
  const c = computeCounts(s.of, j.plan);
  const sdg = s.of('sdg')[0];
  const team = s.of('members').map(m => m.name).join(', ');
  return <div className="deckWrap">
    <div className="deckBar noPrint">
      <Link className="outlineBtn" href="/story">Back to story mode</Link>
      <label className="checkRow"><input type="checkbox" checked={showNotes} onChange={e => setShowNotes(e.target.checked)} /> Show speaker notes</label>
      <button className="primaryBtn" onClick={() => window.print()}>Print or save as PDF</button>
      <span className="muted">Print with landscape orientation and no margins for one slide per page.</span>
    </div>
    <section className="slide cover" aria-label="Title slide">
      <span className="eyebrow">Design Thinking · UN SDG 4</span>
      <h1>ResumeLoop</h1>
      <p className="slideLead">Helping working learners find the one right next task after a missed class.</p>
      <p className="muted">{team || 'Team names in the Course hub'} · {new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
    </section>
    {STOPS.map((st, i) => <section key={st.key} className="slide" aria-label={`Slide ${i + 2}: ${st.title}`}>
      <div className="slideHead"><span className="eyebrow">{i + 1} / {STOPS.length}</span>{presenters[st.key] && <span className="tag">{presenters[st.key]}</span>}</div>
      <h2>{st.title}</h2>
      <p className="slideLead">{st.method}</p>
      <ul className="slideFacts">{st.lines(c).map(l => <li key={l}>{l}</li>)}</ul>
      {showNotes && notes[st.key] && <aside className="speaker"><strong>Speaker notes</strong><p>{notes[st.key]}</p></aside>}
    </section>)}
    <section className="slide" aria-label="Closing slide">
      <span className="eyebrow">Recommendation</span>
      <h2>What we ask for next</h2>
      {sdg?.impact_hypothesis ? <p className="slideLead">{sdg.impact_hypothesis}</p> : <p className="slideLead">Write the impact hypothesis in the Course hub SDG canvas.</p>}
      <ul className="slideFacts"><li>Evidence so far: {sdg?.evidence || 'add it in the SDG canvas'}</li><li>Measure: {sdg?.indicator || 'add the indicator in the SDG canvas'}</li>
        <li>Limitations: small purposive sample; fictional course in the prototype</li></ul>
    </section>
  </div>;
}
