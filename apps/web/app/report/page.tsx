"use client";
import {useEffect, useMemo, useState} from 'react';
import {PageHead} from '@/components/AppShell';
import {useStudio} from '@/components/StudioBits';
import {assist} from '@/lib/assist';
import {summarise} from '@/lib/stats';
import {ALTERNATIVES, type Item} from '@/lib/studio';

type Sec = {title: string; lines: string[]};

export default function ReportPage() {
  const s = useStudio();
  const [practice, setPractice] = useState(false);
  const [ai, setAi] = useState<Record<string, number>>({});
  useEffect(() => { assist.log().then(l => setAi(l.counts)).catch(() => {}); }, []);
  const sections = useMemo<Sec[]>(() => {
    const keep = (i: Item) => practice || !i.synthetic;
    const notes = s.of('notes').filter(keep); const noteIds = new Set(notes.map(n => n.id));
    const codes = s.of('codes').filter(c => c.status === 'accepted' && noteIds.has(c.parent_id || ''));
    const owner = (c: Item) => notes.find(n => n.id === c.parent_id);
    const people = s.of('participants'); const obs = s.of('observations').filter(keep);
    const themes = s.of('themes'); const sdg = s.of('sdg')[0];
    const quoteOk = (c: Item) => owner(c)?.consent?.quotes;
    const exps = s.of('experiments').filter(keep).filter(e => e.frozen_at);
    const votes = s.of('votes'); const ideas = s.of('ideas');
    const scores = s.of('scores');
    const avg = (alt: string) => { const v = scores.filter(x => x.alternative === alt).map(x => x.value as number); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : 'not scored'; };
    const risks = s.of('risks'); const members = s.of('members'); const contribs = s.of('contributions'); const rubric = s.of('rubric');
    return [
      {title: 'Problem and SDG framing', lines: sdg ? [`Goal: ${sdg.goal}`, sdg.targets && `Targets: ${sdg.targets}`, sdg.problem && `Problem: ${sdg.problem}`,
        sdg.impact_hypothesis && `Impact hypothesis (not yet a finding): ${sdg.impact_hypothesis}`, sdg.indicator && `Indicator: ${sdg.indicator}`].filter(Boolean) as string[] : ['Not written yet (Course hub → SDG impact canvas).']},
      {title: 'Research', lines: [`${people.filter(p => p.consent === 'consented').length} consented participants: ${people.filter(p => p.segment === 'learner' && p.consent === 'consented').length} learners, ${people.filter(p => p.segment === 'coordinator' && p.consent === 'consented').length} coordinators, ${people.filter(p => p.user_type.startsWith('extreme') && p.consent === 'consented').length} extreme users.`,
        `${notes.length} research notes, ${obs.length} observations, ${s.of('interviews').length} captured interviews.`,
        `Methods: semi-structured interviews and contextual observation (IDEO Field Guide), extreme and mainstream users, analogous inspiration.`]},
      {title: 'Synthesis', lines: themes.length ? themes.map(t => { const cs = codes.filter(c => c.theme_id === t.id); const ps = new Set(cs.map(c => owner(c)?.participant_code));
        const q = cs.find(quoteOk); return `${t.title}: ${cs.length} codes from ${ps.size} participants.${t.insight ? ` Insight: ${t.insight}.` : ''}${q ? ` Example quote (consented): “${q.quote}” (${owner(q)?.participant_code}).` : ''}`; }) : ['No themes yet.']},
      {title: 'Personas and point of view', lines: [...s.of('personas').map(p => `Persona “${p.label}”: ${p.evidence_ids?.length ? `${p.evidence_ids.length} evidence links` : 'assumption, no evidence yet'}.`),
        ...s.of('povs').map(p => `POV: ${p.user} needs a way to ${p.need} because ${p.insight}.`)]},
      {title: 'Envision and ideate', lines: [...s.of('hills').map(h => `Hill: ${h.who} can ${h.what}, ${h.wow}.${h.measure ? ` Measure: ${h.measure}.` : ''}`),
        `${s.of('hmw').length} How might we questions, ${ideas.length} ideas, ${votes.length} votes, ${s.of('sprints').reduce((a, x) => a + x.sketches.length, 0)} Crazy 8s sketches.`,
        ...[...ideas].sort((a, b) => votes.filter(v => v.parent_id === b.id).length - votes.filter(v => v.parent_id === a.id).length).slice(0, 3).map(i => `Top idea: ${i.title} (${votes.filter(v => v.parent_id === i.id).length} votes).`),
        ...ALTERNATIVES.map(([v, l]) => `Alternative “${l}”: average score ${avg(v)} / 5.`)]},
      {title: 'Prototype iterations', lines: s.of('prototypes').map(p => `${p.version} (${p.fidelity}) ${p.title}. Changed: ${p.what_changed || '—'}. Why: ${p.why || '—'}. Feedback items: ${p.feedback.length}.`)},
      {title: 'Testing', lines: exps.length ? exps.flatMap(e => { const sum = summarise(s.of('sessions', e.id).filter(keep), e.tasks);
        return [`Protocol “${e.title}” frozen ${e.frozen_at?.slice(0, 10)} (SHA-256 ${e.protocol_sha256?.slice(0, 12)}…). ${sum.participants} participants, ${sum.sessions} sessions.`,
          ...sum.perTask.map(t => `${t.name}: success A ${t.a.success}/${t.a.n}, B ${t.b.success}/${t.b.n}; median seconds A ${t.a.medianSeconds ?? '—'}, B ${t.b.medianSeconds ?? '—'}; ${t.sign.n ? `${t.sign.bFaster}/${t.sign.n} faster with B, sign test p = ${t.sign.p!.toFixed(3)} (formative)` : 'no pairs yet'}.`)]; }) : ['No frozen protocol yet.']},
      {title: 'Ethics and governance', lines: [`${risks.length} AI risks logged, ${risks.filter(r => r.status === 'open' && r.likelihood * r.impact >= 6).length} high and open.`,
        ...risks.filter(r => r.likelihood * r.impact >= 6).map(r => `High risk: ${r.risk}. Mitigation: ${r.mitigation || 'none yet'}.`),
        `AI calls logged: ${Object.entries(ai).map(([k, v]) => `${v} ${k}`).join(', ') || 'none'}. Local open models, no training, human approval for codes and messages.`]},
      {title: 'Team contributions', lines: members.length ? members.map(m => `${m.name}${m.role ? ` (${m.role})` : ''}: ${contribs.filter(c => c.member === m.name).map(c => `${c.area}: ${c.description}`).join('; ') || 'no contributions logged'}.`) : ['No members recorded (Course hub).']},
      {title: 'Rubric self-check', lines: rubric.length ? [`${rubric.filter(r => r.status === 'ready').length}/${rubric.length} criteria self-rated ready.`, ...rubric.filter(r => r.status !== 'ready').map(r => `Gap (${r.component}): ${r.criterion}.`)] : ['Load the outline structure in the Course hub.']},
      {title: 'Limitations', lines: ['Small, purposive, non-representative sample; findings are exploratory.', 'The course used in the prototype is fictional.', practice ? 'PRACTICE VIEW: fictional examples are included and must not be cited.' : 'Fictional examples are excluded from every count above.']},
    ];
  }, [s, practice, ai]);
  const md = '# ResumeLoop evidence report\n\n' + sections.map(x => `## ${x.title}\n\n${x.lines.map(l => `- ${l}`).join('\n') || '- Nothing yet.'}`).join('\n\n') + '\n';
  const download = () => { const url = URL.createObjectURL(new Blob([md], {type: 'text/markdown'})); const a = document.createElement('a'); a.href = url; a.download = 'resumeloop-evidence-report.md'; a.click(); URL.revokeObjectURL(url); };
  return <>
    <PageHead eyebrow="Present and reflect · group assignment, 40%" title="Evidence report" intro="Everything in the studio compiled into one report, in the order the group rubric reads it. Copy it into your write-up, print it to PDF, or download it as Markdown.">
      <div className="detailActions"><button className="primaryBtn" onClick={download}>Download Markdown</button><button className="outlineBtn" onClick={() => window.print()}>Print or save as PDF</button></div>
    </PageHead>
    <label className="checkRow noPrint"><input type="checkbox" checked={practice} onChange={e => setPractice(e.target.checked)} /> Practice view: include fictional examples (never cite these)</label>
    <article className="report panel">{sections.map(x => <section key={x.title}><h2>{x.title}</h2>{x.lines.length ? <ul>{x.lines.map((l, i) => <li key={i}>{l}</li>)}</ul> : <p className="muted">Nothing yet.</p>}</section>)}</article>
  </>;
}
