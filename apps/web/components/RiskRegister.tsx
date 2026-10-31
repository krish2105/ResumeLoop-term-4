"use client";
import {QuickForm} from '@/components/QuickForm';
import {studio, type Item} from '@/lib/studio';

type Run = (fn: () => Promise<unknown>, ok?: string) => Promise<boolean>;
const LEVEL = ['', 'Low', 'Medium', 'High'];
const band = (l: number, i: number) => (l * i >= 6 ? 'h' : l * i >= 3 ? 'm' : 'l');

export function RiskRegister({risks, run}: {risks: Item[]; run: Run}) {
  return <section className="panel sectionGap" aria-labelledby="risk-h">
    <h2 id="risk-h">AI risk register</h2>
    <p>Likelihood × impact. Anything in the red band needs a mitigation and an owner before a pilot.</p>
    <div className="twoCol">
      <div className="riskGrid" role="table" aria-label="Risk matrix: impact rows, likelihood columns">
        <div style={{display: 'contents'}} role="row"><div className="axis" role="columnheader">Impact ↓ / Likelihood →</div>{[1, 2, 3].map(l => <div key={l} className="axis" role="columnheader">{LEVEL[l]}</div>)}</div>
        {[3, 2, 1].map(i => <div key={i} style={{display: 'contents'}} role="row"><div className="axis" role="rowheader">{LEVEL[i]}</div>
          {[1, 2, 3].map(l => <div key={l} role="cell" className={'cell ' + band(l, i)}>{risks.filter(r => r.likelihood === l && r.impact === i).map(r => <div key={r.id}>{r.risk}</div>)}</div>)}</div>)}
      </div>
      <QuickForm id="risk" submitLabel="Add risk" fields={[
        {name: 'risk', label: 'Risk', required: true, wide: true, placeholder: 'The coach states a deadline the sources do not support'},
        {name: 'category', label: 'Category', type: 'select', options: [['accuracy', 'Accuracy'], ['privacy', 'Privacy'], ['bias', 'Bias'], ['autonomy', 'Learner autonomy'], ['security', 'Security'], ['wellbeing', 'Wellbeing']]},
        {name: 'likelihood', label: 'Likelihood', type: 'select', options: [['1', 'Low'], ['2', 'Medium'], ['3', 'High']]},
        {name: 'impact', label: 'Impact', type: 'select', options: [['1', 'Low'], ['2', 'Medium'], ['3', 'High']]},
        {name: 'owner', label: 'Owner'}, {name: 'mitigation', label: 'Mitigation', type: 'textarea'},
      ]} onSubmit={v => run(() => studio.create('risks', {...v, likelihood: Number(v.likelihood), impact: Number(v.impact), status: 'open'}), 'Risk added.')} />
    </div>
    <ul className="checkList sectionGap">{risks.map(r => <li key={r.id}><span className={'tag ' + (band(r.likelihood, r.impact) === 'h' ? 'danger' : band(r.likelihood, r.impact) === 'm' ? 'warn' : 'ok')}>{LEVEL[r.likelihood]} × {LEVEL[r.impact]}</span>
      <div><strong>{r.risk}</strong><p className="meta">{r.category}{r.owner ? ` · owner ${r.owner}` : ''}{r.mitigation ? ` · ${r.mitigation}` : ' · no mitigation yet'}</p></div>
      <button className="outlineBtn" onClick={() => run(() => studio.update('risks', r.id, {status: r.status === 'open' ? 'mitigated' : 'open'}))}>{r.status === 'open' ? 'Mark mitigated' : 'Reopen'}</button></li>)}</ul>
  </section>;
}

export function RolePlay({plays, run}: {plays: Item[]; run: Run}) {
  return <section className="panel sectionGap" aria-labelledby="rp-h">
    <h2 id="rp-h">Governance role-play</h2>
    <p>Act out a hard decision with assigned roles, then record what the group decided and why.</p>
    <QuickForm id="rp" submitLabel="Record role-play" fields={[
      {name: 'scenario', label: 'Scenario', type: 'textarea', required: true, placeholder: 'The provider wants learner engagement analytics exported to employers.'},
      {name: 'roles', label: 'Roles (comma separated)', required: true, wide: true, placeholder: 'Learner, Coordinator, Data protection officer, Employer'},
      {name: 'decision', label: 'Decision', type: 'textarea'}, {name: 'rationale', label: 'Rationale', type: 'textarea'},
    ]} onSubmit={v => run(() => studio.create('roleplays', {...v, roles: v.roles.split(',').map(x => x.trim()).filter(Boolean)}), 'Role-play recorded.')} />
    <ul className="queueList">{plays.map(p => <li key={p.id}><strong>{p.scenario}</strong><div className="tagRow">{p.roles.map((r: string) => <span key={r} className="tag">{r}</span>)}</div>
      {p.decision && <p>Decision: {p.decision}</p>}{p.rationale && <p>Why: {p.rationale}</p>}</li>)}</ul>
  </section>;
}
