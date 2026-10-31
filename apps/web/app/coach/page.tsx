"use client";
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {Suspense, useEffect, useRef, useState} from 'react';
import {AiBadge} from '@/components/AiBadge';
import {PageHead} from '@/components/AppShell';
import {assist, SUGGESTED, type AiStatus, type CoachAnswer} from '@/lib/assist';
import {learning} from '@/lib/client';

type Turn = {question: string; about: string | null; answer?: CoachAnswer; error?: string};

export default function CoachPage() {
  return <Suspense fallback={<p className="empty">Loading the coach…</p>}><Coach /></Suspense>;
}

function Coach() {
  const params = useSearchParams();
  const [about, setAbout] = useState<string | null>(params.get('about'));
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [inputError, setInputError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    assist.status().then(setStatus).catch(() => setStatus(null));
    learning.course().then(c => setTitles(Object.fromEntries(c.actions.map(a => [a.id, a.title])))).catch(() => {});
    try { const saved = sessionStorage.getItem('rl-coach'); if (saved) setTurns(JSON.parse(saved)); } catch { /* ignore */ }
  }, []);
  useEffect(() => { try { sessionStorage.setItem('rl-coach', JSON.stringify(turns.slice(-20))); } catch { /* ignore */ } endRef.current?.scrollIntoView({block: 'nearest'}); }, [turns]);
  const ask = async (q: string) => {
    const text = q.trim();
    if (text.length < 3) { setInputError('Type a question of at least 3 characters.'); return; }
    setInputError(''); setBusy(true); setQuestion('');
    setTurns(t => [...t, {question: text, about}]);
    try {
      const answer = await assist.coach(text, about);
      setTurns(t => t.map((x, i) => i === t.length - 1 ? {...x, answer} : x));
    } catch (e) {
      setTurns(t => t.map((x, i) => i === t.length - 1 ? {...x, error: e instanceof Error ? e.message : String(e)} : x));
    } finally { setBusy(false); }
  };
  return <>
    <PageHead eyebrow="Learner" title="Recovery coach" intro="Answers only from the fictional course notes, with a citation for every claim. If the notes don't cover it, the coach says so and offers to ask the coordinator.">
      <span className={'aiStatus ' + (status?.available ? 'on' : 'off')}>{status ? (status.available ? `Live · ${status.gen_model} via Ollama` : status.runtime.includes('recorded') ? 'Recorded answers' : 'AI offline · keyword search only') : 'Checking AI…'}</span>
    </PageHead>
    <div className="twoCol coachLayout">
      <section className="panel chat" aria-label="Conversation">
        {about && <p className="aboutChip">Asking about: <strong>{titles[about] || about}</strong> <button className="textBtn" onClick={() => setAbout(null)}>Clear</button></p>}
        {turns.length === 0 && <div className="emptyChat"><h2>Ask anything about the course</h2><p>Try one of these:</p></div>}
        <div className="suggestions">{SUGGESTED.map(s => <button key={s} className="chipBtn" disabled={busy} onClick={() => ask(s)}>{s}</button>)}</div>
        <ol className="turns" aria-live="polite">
          {turns.map((t, i) => <li key={i}>
            <p className="bubble you"><span className="sr-only">You asked: </span>{t.question}</p>
            {!t.answer && !t.error && <p className="bubble bot" aria-busy="true">Checking the course notes…</p>}
            {t.error && <p className="bubble bot errorBubble" role="alert">{t.error}</p>}
            {t.answer && <div className={'bubble bot' + (t.answer.abstained ? ' abstain' : '')}>
              <AiBadge mode={t.answer.mode} model={t.answer.model} recordedAt={t.answer.recorded_at} />
              <p>{t.answer.answer}</p>
              {!!t.answer.citations.length && <p className="chips">Sources: {t.answer.citations.map(c => <a key={c} className="chip" href={`#src-${i}-${c}`}>{c}</a>)}</p>}
              {t.answer.offer_escalation && <Link className="outlineBtn" href={`/escalations?q=${encodeURIComponent(t.question)}${t.about ? `&about=${t.about}` : ''}`}>Ask the coordinator</Link>}
              {!!t.answer.sources.length && <details><summary>Passages the coach read ({t.answer.retrieval})</summary>
                <ul className="sourceList">{t.answer.sources.map(s => <li key={s.id} id={`src-${i}-${s.id}`}><strong>{s.id} · {s.title}</strong> <small>match {s.score}</small><p>{s.text}</p></li>)}</ul></details>}
            </div>}
          </li>)}
        </ol>
        <div ref={endRef} />
        <form className="askForm" onSubmit={e => { e.preventDefault(); ask(question); }}>
          <label htmlFor="q" className="sr-only">Your question</label>
          <input id="q" value={question} onChange={e => { setQuestion(e.target.value); setInputError(''); }} placeholder="When is the reading check quiz due?" maxLength={500} aria-invalid={!!inputError} aria-describedby="q-error" />
          <button className="primaryBtn" disabled={busy}>{busy ? 'Thinking…' : 'Ask'}</button>
        </form>
        <p id="q-error" className="fieldError" role="alert">{inputError}</p>
      </section>
      <aside className="panel">
        <h2>How the coach stays honest</h2>
        <ol className="factList">
          <li>It searches the course notes with local embeddings (bge-m3), or keywords if those are offline.</li>
          <li>Only passages above a match threshold go to the model.</li>
          <li>Every citation is checked against those passages. An unknown citation means no answer.</li>
          <li>Every call is logged in <Link href="/studio/ethics">Ethics and governance</Link>.</li>
        </ol>
        {turns.length > 0 && <button className="textBtn" onClick={() => setTurns([])}>Clear conversation</button>}
      </aside>
    </div>
  </>;
}
