"use client";
import {useEffect,useMemo,useState} from 'react';
import ImportPanel from './ImportPanel';

type RecordRow={id:string; title:string;subtitle:string;metric_value:string;metric_label:string;status:string;evidence:string;source_type:string};
type Mode='light'|'dark'|'system';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';
const PROJECT="ResumeLoop";
const LINKS=["Overview", "Recovery plans", "Coordinator inbox", "Research evidence", "Settings", "Imports", "Methodology"];


export default function Home(){
 const [mode,setMode]=useState<Mode>('system');
 const [resolved,setResolved]=useState<'light'|'dark'>('light');
 const [section,setSection]=useState('Overview');
 const [rows,setRows]=useState<RecordRow[]>([]);
 const [selected,setSelected]=useState<string>('');
 const [search,setSearch]=useState('');
 const [status,setStatus]=useState('all');
 const [note,setNote]=useState('');
 const [reviewStatus,setReviewStatus]=useState('approved');
 const [msg,setMsg]=useState('');
 const [loading,setLoading]=useState(true);
 const [loaded,setLoaded]=useState(false);
 const [saving,setSaving]=useState(false);
 const [domain,setDomain]=useState<Record<string,unknown>|null>(null);
 const [themeReady,setThemeReady]=useState(false);
 const [themeWarning,setThemeWarning]=useState('');
 useEffect(()=>{try{const saved=localStorage.getItem('ResumeLoop-theme') as Mode|null;if(saved&&['light','dark','system'].includes(saved))setMode(saved);}catch{setThemeWarning('Appearance cannot be saved in this browser.');}setThemeReady(true);},[]);
 useEffect(()=>{if(!themeReady)return;try{localStorage.setItem('ResumeLoop-theme',mode);}catch{setThemeWarning('Appearance cannot be saved in this browser.');}const media=window.matchMedia('(prefers-color-scheme: dark)');const apply=()=>setResolved(mode==='system'?(media.matches?'dark':'light'):mode);apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);},[mode,themeReady]);
 useEffect(()=>{document.documentElement.dataset.theme=resolved;},[resolved]);
 const reload=async()=>{const r=await fetch(API+'/api/demo/records',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('API returned '+r.status);const data=await r.json();setRows(data);setLoaded(true);setSelected(current=>data.some((x:RecordRow)=>x.id===current)?current:(data[0]?.id||''));};
 useEffect(()=>{(async()=>{try{await reload();const r=await fetch(API+'/api/demo/domain');if(r.ok)setDomain(await r.json());}catch(e){setMsg('API is unavailable: check the configured local FastAPI service. '+String(e));}finally{setLoading(false);}})();},[]);
 const active=rows.find(r=>r.id===selected)||null;
 const filtered=useMemo(()=>rows.filter(r=>(status==='all'||r.status===status)&&(r.title+' '+r.subtitle+' '+r.id).toLowerCase().includes(search.toLowerCase())),[rows,status,search]);
 const counts=useMemo(()=>Object.fromEntries(['ready','needs-review','blocked','approved','rejected'].map(s=>[s,rows.filter(r=>r.status===s).length])),[rows]);
 const save=async()=>{if(!active)return;setSaving(true);setMsg('');try{const r=await fetch(API+'/api/demo/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({record_id:active.id,status:reviewStatus,note:note.trim()})});if(!r.ok)throw Error(await r.text());await reload();setNote('');setMsg('Review saved to local demonstration database.');}catch(e){setMsg('Review failed: '+String(e));}finally{setSaving(false);}};
 return <div className={section==='Overview'?"shell":"shell workspaceOnly"}><a className="skipLink" href="#main-content">Skip to content</a>
  <aside className="sidebar"><div className="brand"><span className="brandMark">R</span><div><strong>{PROJECT}</strong><small>MAIB independent lab</small></div></div>
   <div className="navHeading">WORKSPACE</div><nav aria-label="Main navigation">{LINKS.map(l=><button key={l} className={section===l?'nav active':'nav'} aria-current={section===l?'page':undefined} onClick={()=>{setSection(l);setMsg('');}}>{l}</button>)}</nav>
   <div className="sideFoot"><strong>Local demonstration</strong><p>Fictional records. No trained AI model or commercial customer data is included.</p><span className="dotline"><span className="dot"/> Starter v0.1</span></div>
  </aside>
  <main className="main" id="main-content" tabIndex={-1}><header className="topbar"><div className="breadcrumb">WORKSPACE <span>/</span> {section}</div><div className="toolbar"><label htmlFor="theme" className="sr-only">Appearance</label><select id="theme" value={mode} onChange={e=>setMode(e.target.value as Mode)} aria-label="Appearance"><option value="system">◐ System</option><option value="light">☀ Light</option><option value="dark">☾ Dark</option></select><span className="avatar">S</span></div></header>
   <div className="content"><div className="hero"><div><span className="eyebrow">MAIB MGT 204 · RESEARCH STARTER</span><h1>{section==='Overview'? 'Find your way back to learning.':section}</h1><p>Understand what changed, choose a viable next study action, and obtain support when needed.</p></div><span className="heroTag">SYNTHETIC DATA</span></div>
   {themeWarning&&<p role="status">{themeWarning}</p>}{msg&&<div role="status" className="toast">{msg} <button className="outlineBtn" onClick={async()=>{try{await reload();setMsg('Queue refreshed.');}catch{setMsg('Queue unavailable. Check the local API and retry.');}}}>Retry queue</button></div>}
   {section==='Overview'? <><div className="statGrid"><div className="stat"><small>DEMO CASES</small><strong>{loaded?rows.length:'—'}</strong><span>Sample records, not KPIs</span></div><div className="stat"><small>NEED REVIEW</small><strong>{loaded?(counts['needs-review']||0):'—'}</strong><span>Awaiting example decision</span></div><div className="stat"><small>BLOCKED</small><strong>{loaded?(counts['blocked']||0):'—'}</strong><span>Missing demo evidence</span></div><div className="stat"><small>APPROVED</small><strong>{loaded?(counts['approved']||0):'—'}</strong><span>Local review status</span></div></div><section className="panel"><div className="sectionHead"><div><h2>Review work queue</h2><p>Act on a sample record or open its source note.</p></div><button className="outlineBtn" onClick={()=>setSection('Imports')}>Import sample →</button></div>{Queue()}</section></> :
    section==='Imports' ? <ImportPanel api={API} onSaved={reload}/> :
    section==='Methodology'? <section className="panel"><h2>Transparent calculation demonstration</h2><p>This is a coded domain check, not a trained AI result. Academic claims require consented observations and a comparison with the current learning workflow. No trained model is required for this study.</p><pre className="codeSample">{JSON.stringify(domain,null,2)}</pre><p>See <code>docs/DATA_AND_RESEARCH.md</code>, <code>docs/PIPELINE.md</code> and <code>project/CURRENT_STATE.md</code> for research and development status.</p></section>:
    section==='Settings'? <section className="panel"><h2>Appearance & data safety</h2><p>Theme changes persist locally. Set Light, Dark or System from the top right. Demo data is stored in local SQLite, with no sign-in or commercial tenancy.</p><p>Before using real data, add authentication, tenant isolation, rights and privacy controls, and operational logging.</p></section>:
    <section className="panel futurePanel">{section==='Recovery plans'&&<img src="/images/empty-recovery-plan.png" width="180" height="180" alt=""/>}<span className="pill">Planned · not yet implemented</span><h2>{section==='Recovery plans'?'Your return starts with one next step':section==='Coordinator inbox'?'A clear path to support':'Listen first. Build from evidence.'}</h2><p>{section==='Recovery plans'?'Personal recovery plans and saved study progress are not available yet. You can inspect the deterministic sample in Methodology or test source import.':section==='Coordinator inbox'?'Coordinator requests are not connected. No messages or approvals are sent from this prototype.':'No participant interviews or usability results have been collected. The research kit contains consent, interview, observation and testing materials ready for review.'}</p><button className="outlineBtn" onClick={()=>setSection(section==='Recovery plans'?'Methodology':'Imports')}>{section==='Recovery plans'?'Explore the sample method':'Try the import journey'} →</button></section>
   }
   <footer>© {new Date().getFullYear()} {PROJECT} research starter · Fictional records · Not production-ready</footer></div>
  </main>
  {active&&section==='Overview'&&<aside className="inspector" aria-label="Record inspector"><div className="inspectorHeader"><span className="eyebrow">RECORD DETAILS</span><span className="pill">{active.source_type}</span></div><h2>{active.title}</h2><p>{active.subtitle}</p><div className="miniMetric"><strong>{active.metric_value}</strong><span>{active.metric_label}</span></div><h3>Evidence and limitations</h3><div className="evidence">{active.evidence}</div><div className="meta"><span>Record ID</span><code>{active.id}</code></div><div className="meta"><span>Status</span><strong>{active.status.replaceAll('-',' ')}</strong></div><div className="review"><h3>Record a demo decision</h3><label htmlFor="reviewstatus">Disposition</label><select id="reviewstatus" value={reviewStatus} onChange={e=>setReviewStatus(e.target.value)}><option value="approved">Approved</option><option value="needs-review">Needs review</option><option value="blocked">Blocked</option><option value="rejected">Rejected</option></select><label htmlFor="reviewnote">Review rationale</label><textarea maxLength={2000} id="reviewnote" value={note} onChange={e=>setNote(e.target.value)} placeholder="Explain why this is the correct disposition…" rows={4}/><button className="primaryBtn" disabled={saving||note.trim().length<3} onClick={save}>{saving?'Saving…':'Save review'}</button></div></aside>}
 </div>;
 function Queue(){return <><div className="filters"><input aria-label="Search cases" placeholder="Search cases and records…" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filter by status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="ready">Ready</option><option value="needs-review">Needs review</option><option value="blocked">Blocked</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><span>{filtered.length} of {rows.length}</span></div><div className="tableWrap"><table><thead><tr><th>Case</th><th>Evidence summary</th><th>Demo metric</th><th>Status</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id} className={selected===r.id?'selected':''}><td><button className="rowBtn" onClick={()=>setSelected(r.id)}><strong>{r.title}</strong><small>{r.id}</small></button></td><td>{r.subtitle}</td><td><strong>{r.metric_value}</strong> <span className="muted">{r.metric_label}</span></td><td><span className={'status '+r.status}>{r.status.replaceAll('-',' ')}</span></td></tr>)}</tbody></table>{loaded&&!loading&&filtered.length===0&&<p className="empty">No demo cases match this filter. Try clearing the search.</p>}{loading&&<p className="empty">Loading local sample records…</p>}</div></>}
}
