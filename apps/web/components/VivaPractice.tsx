"use client";
import {useEffect, useState} from 'react';
import {studio} from '@/lib/studio';

// Questions an examiner is likely to ask, derived from the group rubric criteria (§3.4) and the outcomes.
const QUESTIONS = [
  'Which design thinking framework did you use, and why that one?',
  'How did you choose your participants, and who is missing from your sample?',
  'Show one theme and walk me from a quote to the insight.',
  'What surprised you in the research, and what did you change because of it?',
  'Why ResumeLoop rather than an improved LMS checklist or a coordinator brief?',
  'What does your Hill statement promise, and how will you measure it?',
  'What did your usability test show, and what are its limits?',
  'What could go wrong with the AI coach, and how do you prevent it?',
  'How does this contribute to SDG 4, and what is still only a hypothesis?',
  'What was your personal contribution to the group work?',
  'If you had another month, what would you test next?',
  'What would make you stop or pivot this project?',
];

export function VivaPractice({run}: {run: (fn: () => Promise<unknown>, ok?: string) => Promise<boolean>}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  useEffect(() => { try { setAnswers(JSON.parse(localStorage.getItem('rl-viva') || '{}')); } catch { /* ignore */ } }, []);
  const set = (i: number, v: string) => setAnswers(a => { const n = {...a, [i]: v}; try { localStorage.setItem('rl-viva', JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const today = new Date().toISOString().slice(0, 10);
  return <section className="panel sectionGap" aria-labelledby="viva-h">
    <h2 id="viva-h">Viva practice (oral defence)</h2>
    <p>The group rubric grades each person's oral presentation and defence. Draft a short answer in your own words, then turn it into a flashcard to drill.</p>
    <ol className="vivaList">{QUESTIONS.map((q, i) => <li key={i}><strong>{q}</strong>
      <label className="sr-only" htmlFor={'viva' + i}>Your answer to: {q}</label>
      <textarea id={'viva' + i} rows={2} value={answers[i] || ''} onChange={e => set(i, e.target.value)} placeholder="Two or three sentences, with one piece of evidence" />
      <button className="textBtn" disabled={(answers[i] || '').trim().length < 3}
        onClick={() => run(() => studio.create('flashcards', {front: q, back: answers[i].trim(), reading_id: null, box: 1, due: today, reviews: 0, correct: 0}), 'Flashcard created from your answer.')}>Make flashcard</button></li>)}</ol>
  </section>;
}
