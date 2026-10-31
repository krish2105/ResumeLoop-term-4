"use client";
import {PageHead} from '@/components/AppShell';
import {QuickForm} from '@/components/QuickForm';
import {FacultyQuestions} from '@/components/FacultyQuestions';
import {Msg, useStudio} from '@/components/StudioBits';
import {studio, type Item} from '@/lib/studio';

const AREAS = ['research', 'synthesis', 'ideation', 'prototype', 'testing', 'presentation', 'reflection'] as const;
const STATUS = [['missing', 'Missing'], ['partial', 'Partial'], ['ready', 'Ready']] as const;

export default function CoursePage() {
  const s = useStudio();
  const milestones = s.of('milestones');
  const rubric = s.of('rubric');
  const members = s.of('members');
  const contributions = s.of('contributions');
  const sdg = s.of('sdg')[0];
  const groups = [...new Set(rubric.map(r => r.component as string))];
  const ready = rubric.filter(r => r.status === 'ready').length;
  return <>
    <PageHead art="sdg4-lifelong-learning" eyebrow="Present and reflect" title="Course hub" intro="Assessment weights, a rubric self-check against the outline's criteria, who did what, and the SDG impact canvas for the Week 12 presentation.">
      {milestones.length === 0 && <button className="primaryBtn" onClick={() => s.run(() => studio.seedCourseHub(), 'Loaded the assessment components and rubric criteria.')}>Load outline structure</button>}
    </PageHead>
    <Msg text={s.msg} />
    <FacultyQuestions />
    <div className="twoCol sectionGap">
      <section className="panel" aria-labelledby="ms-h">
        <h2 id="ms-h">Assessment components</h2>
        <p>Dates stay unverified: the outline's two schedules disagree. Mark a date verified only after faculty confirm it.</p>
        <ol className="timeline">{milestones.map(m => <li key={m.id} className="assess">
          <div className="sectionHead"><div><strong>{m.title}</strong><p className="meta">{m.weight != null ? `${m.weight}% · ` : ''}{m.when_text || 'no date'} · {m.source}</p></div>
            <select aria-label={`Status for ${m.title}`} value={m.status} onChange={e => s.run(() => studio.update('milestones', m.id, {status: e.target.value}))}>
              <option value="unverified">Date unverified</option><option value="verified">Date verified</option><option value="done">Submitted</option></select></div>
          <label className="sr-only" htmlFor={'mw' + m.id}>Date for {m.title}</label>
          <input id={'mw' + m.id} defaultValue={m.when_text} onBlur={e => e.target.value !== m.when_text && s.run(() => studio.update('milestones', m.id, {when_text: e.target.value}), 'Date updated.')} placeholder="Date from the faculty brief" /></li>)}</ol>
        {milestones.length > 0 && <p className="mono muted">Total weight {milestones.reduce((a, m) => a + (m.weight || 0), 0)}%</p>}
      </section>
      <section className="panel" aria-labelledby="sdg-h">
        <h2 id="sdg-h">SDG impact canvas</h2>
        {sdg ? <SdgEditor item={sdg} run={s.run} /> : <p className="empty">Load the outline structure to start the canvas.</p>}
      </section>
    </div>
    <section className="panel sectionGap" aria-labelledby="rb-h">
      <div className="sectionHead"><h2 id="rb-h">Rubric self-check</h2><span className="mono">{ready}/{rubric.length} ready</span></div>
      <div className="progressBar" role="img" aria-label={`${ready} of ${rubric.length} criteria ready`}><i style={{width: `${rubric.length ? (ready / rubric.length) * 100 : 0}%`}} /></div>
      {groups.map(g => <div key={g} className="sectionGap"><h3>{g}</h3>
        <ul className="checkList">{rubric.filter(r => r.component === g).map((r: Item) => <li key={r.id}>
          <span className={'tag ' + (r.status === 'ready' ? 'ok' : r.status === 'partial' ? 'warn' : 'danger')}>{r.status}</span>
          <div><strong>{r.criterion}</strong><label className="sr-only" htmlFor={'ev' + r.id}>Evidence for {r.criterion}</label>
            <input id={'ev' + r.id} defaultValue={r.evidence} placeholder="Where is the evidence? e.g. Empathy studio themes, Experiment lab results" onBlur={e => e.target.value !== r.evidence && s.run(() => studio.update('rubric', r.id, {evidence: e.target.value}))} /></div>
          <select aria-label={`Status for ${r.criterion}`} value={r.status} onChange={e => s.run(() => studio.update('rubric', r.id, {status: e.target.value}))}>{STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </li>)}</ul></div>)}
    </section>
    <section className="panel sectionGap" aria-labelledby="team-h">
      <h2 id="team-h">Team and contributions</h2>
      <p>Works solo or in a group. The group rubric grades each person's oral defence, so record who did what as you go.</p>
      <div className="twoCol">
        <QuickForm id="mem" submitLabel="Add member" fields={[{name: 'name', label: 'Name', required: true}, {name: 'role', label: 'Role'}]} onSubmit={v => s.run(() => studio.create('members', v), 'Member added.')} />
        <QuickForm id="con" submitLabel="Log contribution" fields={[
          {name: 'member', label: 'Member', type: 'select', options: members.length ? members.map(m => [m.name, m.name] as [string, string]) : [['', 'Add a member first']]},
          {name: 'area', label: 'Area', type: 'select', options: AREAS.map(a => [a, a] as [string, string])},
          {name: 'description', label: 'What they did', required: true, wide: true}]}
          onSubmit={v => s.run(() => studio.create('contributions', v), 'Contribution logged.')} />
      </div>
      {members.length > 0 && <div className="tableWrap sectionGap" role="region" tabIndex={0} aria-label="Contribution matrix, scroll horizontally for all areas"><table className="matrix">
        <thead><tr><th>Member</th>{AREAS.map(a => <th key={a}>{a}</th>)}</tr></thead>
        <tbody>{members.map(m => <tr key={m.id}><td><strong>{m.name}</strong><small className="block">{m.role}</small></td>
          {AREAS.map(a => <td key={a} className="mono">{contributions.filter(c => c.member === m.name && c.area === a).length || '·'}</td>)}</tr>)}</tbody></table></div>}
    </section>
  </>;
}

function SdgEditor({item, run}: {item: Item; run: (fn: () => Promise<unknown>, ok?: string) => Promise<boolean>}) {
  const FIELDS: [string, string][] = [['goal', 'Goal'], ['targets', 'Targets'], ['problem', 'Problem in the target context'], ['impact_hypothesis', 'Impact hypothesis (not yet a finding)'],
    ['indicator', 'How you would measure it'], ['evidence', 'Evidence so far'], ['risks', 'Risks and unintended effects']];
  return <div className="editor">{FIELDS.map(([k, label]) => <label key={k} className="stageField">{label}
    <textarea rows={2} defaultValue={item[k]} onBlur={e => e.target.value !== item[k] && run(() => studio.update('sdg', item.id, {[k]: e.target.value}), 'Canvas saved.')} /></label>)}</div>;
}
