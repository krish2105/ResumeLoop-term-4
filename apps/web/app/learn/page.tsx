"use client";
import {useMemo, useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {QuickForm} from '@/components/QuickForm';
import {Msg, useStudio} from '@/components/StudioBits';
import {VivaPractice} from '@/components/VivaPractice';
import {studio, type Item} from '@/lib/studio';

const today = () => new Date().toISOString().slice(0, 10);
const STATUS = [['to-read', 'To read'], ['reading', 'Reading'], ['done', 'Done']] as const;

export default function LearnPage() {
  const s = useStudio();
  const readings = [...s.of('readings')].sort((a, b) => (a.week ?? 99) - (b.week ?? 99));
  const cards = s.of('flashcards');
  const due = cards.filter(c => c.due <= today());
  const log = [...s.of('participation')].sort((a, b) => (a.session_date < b.session_date ? 1 : -1));
  const [open, setOpen] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const required = readings.filter(r => r.required);
  const done = required.filter(r => r.status === 'done').length;
  const accuracy = useMemo(() => { const r = cards.reduce((a, c) => a + c.reviews, 0); return r ? Math.round(cards.reduce((a, c) => a + c.correct, 0) / r * 100) : null; }, [cards]);
  const card = due[0];
  const grade = (ok: boolean) => card && s.run(() => studio.reviewCard(card.id, ok)).then(() => setFlipped(false));
  return <>
    <PageHead art="initial-hero-dusk-road-concept" eyebrow="Class prep · participation 10% and individual quizzes 10%" title="Readings and quizzes" intro="Both 10% components are in-class quizzes on the sessions and readings. Track every reading, write the key ideas in your own words, and drill them with spaced-repetition flashcards.">
      {readings.length === 0 && <button className="primaryBtn" onClick={() => s.run(() => studio.seedReadings(), 'Reading list loaded from the outline.')}>Load the reading list</button>}
    </PageHead>
    <Msg text={s.msg} />
    <div className="statGrid miniStats4">
      <div className="stat"><small>Required readings done</small><strong>{done}/{required.length}</strong><span>from the outline</span></div>
      <div className="stat"><small>Cards due today</small><strong>{due.length}</strong><span>of {cards.length} cards</span></div>
      <div className="stat"><small>Quiz accuracy</small><strong>{accuracy === null ? '—' : `${accuracy}%`}</strong><span>across all reviews</span></div>
      <div className="stat"><small>Sessions logged</small><strong>{log.length}</strong><span>{log.filter(l => l.prepared).length} came prepared</span></div>
    </div>

    <div className="twoCol sectionGap">
      <section className="panel" aria-labelledby="quiz-h">
        <h2 id="quiz-h">Self-quiz</h2>
        {!card ? <p className="empty">{cards.length ? 'Nothing due today. Come back tomorrow.' : 'Write your first flashcard below.'}</p> :
          <div className="flash" aria-live="polite">
            <p className="meta">Box {card.box} of 5 · {readings.find(r => r.id === card.reading_id)?.title || 'General'}</p>
            <p className="flashFront">{card.front}</p>
            {flipped ? <><p className="flashBack">{card.back}</p>
              <div className="detailActions"><button className="primaryBtn" onClick={() => grade(true)}>I knew it</button><button className="outlineBtn" onClick={() => grade(false)}>Not yet</button></div></>
              : <button className="outlineBtn" onClick={() => setFlipped(true)}>Show answer</button>}
          </div>}
        <h3 className="sectionGap">New flashcard</h3>
        <QuickForm id="fc" submitLabel="Add card" fields={[
          {name: 'reading_id', label: 'Reading', type: 'select', options: [['', 'General'], ...readings.map(r => [r.id, (r.week ? `Wk ${r.week} · ` : '') + r.title] as [string, string])], wide: true},
          {name: 'front', label: 'Question', required: true, wide: true, placeholder: 'What three parts make a Hill statement?'},
          {name: 'back', label: 'Answer (your words)', required: true, type: 'textarea', placeholder: 'Who, what, and a measurable wow'},
        ]} onSubmit={v => s.run(() => studio.create('flashcards', {...v, reading_id: v.reading_id || null, box: 1, due: today(), reviews: 0, correct: 0}), 'Card added.')} />
      </section>
      <section className="panel" aria-labelledby="part-h">
        <h2 id="part-h">Participation log</h2>
        <p>The participation rubric scores preparation (45%), engagement (45%) and decorum (10%). Log each session honestly.</p>
        <QuickForm id="part" submitLabel="Log session" initial={{session_date: today()}} fields={[
          {name: 'session_date', label: 'Date', type: 'date', required: true}, {name: 'session_label', label: 'Session', required: true, placeholder: 'Session 3: Observe'},
          {name: 'prepared', label: 'Came prepared?', type: 'select', options: [['yes', 'Yes, read everything'], ['partly', 'Partly'], ['no', 'No']]},
          {name: 'questions_asked', label: 'Questions I asked', type: 'number', min: 0, max: 50},
          {name: 'contributions', label: 'What I contributed', type: 'textarea'},
        ]} onSubmit={v => s.run(() => studio.create('participation', {session_date: v.session_date, session_label: v.session_label, prepared: v.prepared === 'yes',
          readings_done: 0, contributions: v.contributions, questions_asked: Number(v.questions_asked || 0), quiz_feeling: null}), 'Session logged.')} />
        <ul className="queueList">{log.map(l => <li key={l.id}><div className="sectionHead"><strong>{l.session_label}</strong><span className={'tag ' + (l.prepared ? 'ok' : 'warn')}>{l.prepared ? 'prepared' : 'not fully prepared'}</span></div>
          <p className="meta mono">{l.session_date} · {l.questions_asked} questions asked</p>{l.contributions && <p>{l.contributions}</p>}</li>)}</ul>
      </section>
    </div>

    <section className="panel sectionGap" aria-labelledby="read-h">
      <h2 id="read-h">Reading list ({readings.length})</h2>
      <ul className="checkList">{readings.map((r: Item) => <li key={r.id}>
        <span className={'tag ' + (r.status === 'done' ? 'ok' : r.status === 'reading' ? 'warn' : '')}>{r.week ? `Wk ${r.week}` : r.required ? 'Core' : 'Extra'}</span>
        <div><strong>{r.title}</strong><p className="meta">{r.authors}{r.year ? ` · ${r.year}` : ''} · {r.source_kind}{r.required ? '' : ' · recommended'}</p>
          {open === r.id ? <div className="editor sectionGap">
            {(['summary', 'key_concepts', 'questions'] as const).map(f => <label key={f} className="stageField">{f === 'summary' ? 'Summary in my own words' : f === 'key_concepts' ? 'Key concepts' : 'Questions to raise in class'}
              <textarea rows={f === 'summary' ? 4 : 2} defaultValue={r[f]} onBlur={e => e.target.value !== r[f] && s.run(() => studio.update('readings', r.id, {[f]: e.target.value}), 'Saved.')} /></label>)}
            <button className="textBtn" onClick={() => setOpen(null)}>Close notes</button></div>
            : <button className="textBtn" onClick={() => setOpen(r.id)}>{r.summary ? 'Edit notes' : 'Add notes'}</button>}</div>
        <select aria-label={`Status for ${r.title}`} value={r.status} onChange={e => s.run(() => studio.update('readings', r.id, {status: e.target.value}))}>{STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </li>)}</ul>
      {readings.length === 0 && <p className="empty">Load the reading list to start tracking.</p>}
    </section>
    <VivaPractice run={s.run} />
  </>;
}
