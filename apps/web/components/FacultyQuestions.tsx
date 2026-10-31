"use client";
import {useState} from 'react';

// The open questions recorded in project/BLOCKERS.md and docs/ASSESSMENT.md. Copy and send yourself.
const QUESTIONS = [
  'Which schedule applies: the session numbers in §2.5 or the week numbers in §3.1? What are the exact submission dates and the final-session date?',
  'Is the group assignment done in teams? If so, who is in my group; if I am working alone, may I submit individually?',
  'Which design thinking frameworks should the reflective paper integrate (§3.5)?',
  'What ethics approval or consent process do you require before I interview learners or coordinators?',
  'What is the policy on using AI tools in assessed work, and how should I disclose it?',
  'Is UN SDG 4 (Quality Education) an acceptable focus for the Week 12 presentation?',
];

export function FacultyQuestions() {
  const [copied, setCopied] = useState(false);
  const email = `Dear Dr Abraham,\n\nI am preparing my Design Thinking project and would be grateful for clarification on a few points:\n\n${QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nThank you for your time.\n\nKind regards,\n`;
  const copy = async () => { try { await navigator.clipboard.writeText(email); setCopied(true); } catch { setCopied(false); } };
  return <section className="panel sectionGap" aria-labelledby="fq-h">
    <div className="sectionHead"><h2 id="fq-h">Questions for faculty</h2><button className="outlineBtn" onClick={copy}>{copied ? 'Copied' : 'Copy as an email'}</button></div>
    <p>These answers unlock the dates, group rules and frameworks. ResumeLoop never sends email; paste it into your own mail and send it yourself.</p>
    <ol className="factList">{QUESTIONS.map(q => <li key={q}>{q}</li>)}</ol>
  </section>;
}
