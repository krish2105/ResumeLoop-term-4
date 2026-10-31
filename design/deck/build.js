// ResumeLoop Week 12 deck. Run: node build.js <repoRoot>
const path = require('path');
const pptxgen = require('pptxgenjs');
const SKILL = '/Users/krishnamathurm4pro/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/cd6cd030-2ec7-4e3c-917e-29d5791f44c9/ab44df58-fd17-4148-8e2c-16385b1f0b06/skills/pptx';
const {applyTheme} = require(path.join(SKILL, 'scripts/apply_theme.js'));

const ROOT = process.argv[2];
const SHOT = n => path.join(ROOT, 'submissions/screenshots', n + '.jpg');
const ART = n => path.join(__dirname, 'img', n + '.jpg');
const OUT = path.join(ROOT, 'submissions/ResumeLoop_Week12_Presentation.pptx');

const THEME = {
  name: 'ResumeLoop Ember dusk', headFontFace: 'Cambria', bodyFontFace: 'Calibri',
  colors: {dk1: '22160F', lt1: 'FFFFFF', dk2: '3B2A20', lt2: 'FAF6F0', accent1: 'B5401F', accent2: '1D7A4F', accent3: '8A5A00',
    accent4: 'FF8E6B', accent5: '62544B', accent6: 'F2EBE2', hlink: 'B5401F', folHlink: '8F2F14'},
};

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
  pres.author = 'Krishna Mathur';
  pres.title = 'ResumeLoop: find the one right next task after a missed class';
  pres.subject = 'MAIB MGT 204 Design Thinking, Week 12 presentation (UN SDG 4)';
  pres.theme = {headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace};
  const C = pres.SchemeColor;
  const W = 13.333, M = 0.6;

  pres.defineSlideMaster({
    title: 'Title dark', background: {color: C.text1},
    objects: [
      {placeholder: {options: {name: 'title', type: 'title', x: M, y: 2.35, w: 5.6, h: 1.3, fontSize: 60, bold: true, color: C.background1, valign: 'top', align: 'left', margin: 0}, text: ''}},
      {placeholder: {options: {name: 'body', type: 'body', x: M, y: 3.75, w: 5.3, h: 1.4, fontSize: 22, color: C.accent6, valign: 'top', align: 'left', margin: 0}, text: ''}},
    ],
  });
  pres.defineSlideMaster({
    title: 'Content', background: {color: C.background2}, margin: [0.5, 0.6, 0.6, 0.6],
    objects: [
      {placeholder: {options: {name: 'title', type: 'title', x: M, y: 0.4, w: W - 2 * M, h: 0.85, fontSize: 34, bold: true, color: C.text1, valign: 'middle', align: 'left', margin: 0}, text: ''}},
      {text: {text: 'ResumeLoop · MAIB MGT 204 Design Thinking · Krishna Mathur', options: {x: M, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent5, margin: 0}}},
    ],
    slideNumber: {x: W - M - 0.6, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: C.accent5, align: 'right'},
  });

  // ---------- helpers ----------
  const shadow = () => ({type: 'outer', color: '22160F', opacity: 0.16, blur: 10, offset: 3, angle: 90});
  // A framed print: white rounded card with a soft shadow and the picture inset.
  const framed = (s, file, x, y, w, h, name, alt) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {x, y, w, h, rectRadius: 0.12, fill: {color: C.background1}, line: {color: C.accent6, width: 0.75}, shadow: shadow(), objectName: name + ' frame'});
    s.addImage({path: file, x: x + 0.09, y: y + 0.09, w: w - 0.18, h: h - 0.18, sizing: {type: 'cover', w: w - 0.18, h: h - 0.18}, altText: alt, objectName: name});
  };
  // The ember dot: the road's glowing stone, used as the list marker throughout.
  const ember = (s, x, y, name, color = C.accent1) => {
    s.addShape(pres.shapes.OVAL, {x: x - 0.07, y: y - 0.07, w: 0.34, h: 0.34, fill: {color: C.accent4, transparency: 70}, line: {type: 'none'}, objectName: name + ' halo'});
    s.addShape(pres.shapes.OVAL, {x, y, w: 0.2, h: 0.2, fill: {color}, line: {type: 'none'}, objectName: name});
  };
  const text = (s, t, o) => s.addText(t, {isTextBox: true, margin: 0, color: C.text1, fontSize: 16, valign: 'top', ...o});
  const chip = (s, t, x, y, w, name, fill = C.accent6, color = C.accent1) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {x, y, w, h: 0.36, rectRadius: 0.18, fill: {color: fill}, line: {type: 'none'}, objectName: name});
    text(s, t, {x: x + 0.14, y, w: w - 0.28, h: 0.36, fontSize: 11, bold: true, color, valign: 'middle', charSpacing: 1, objectName: name + ' text'});
  };
  const card = (s, x, y, w, h, name, fill = C.background1) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {x, y, w, h, rectRadius: 0.1, fill: {color: fill}, line: {type: 'none'}, shadow: shadow(), objectName: name});
  // Rows of ember-dotted points: [{h: heading, b: body}]
  const points = (s, items, x, y, w, gap = 1.05, name = 'point') => items.forEach((it, i) => {
    const yy = y + i * gap;
    ember(s, x, yy + 0.06, `${name} ${i + 1} dot`);
    text(s, [{text: it.h, options: {bold: true, breakLine: !!it.b}}, ...(it.b ? [{text: it.b, options: {color: C.text2, fontSize: 14}}] : [])],
      {x: x + 0.45, y: yy, w: w - 0.45, h: gap - 0.1, fontSize: 16, paraSpaceAfter: 2, objectName: `${name} ${i + 1}`});
  });
  const content = (title, section) => { const s = pres.addSlide({masterName: 'Content', sectionTitle: section}); s.addText(title, {placeholder: 'title'}); return s; };

  // ---------- 1. Title ----------
  pres.addSection({title: 'Opening'});
  let s = pres.addSlide({masterName: 'Title dark', sectionTitle: 'Opening'});
  s.addImage({path: ART('stop-cover'), x: 6.55, y: 0, w: W - 6.55, h: 7.5, sizing: {type: 'cover', w: W - 6.55, h: 7.5}, altText: 'Paper-cut ember path winding over hills past six waymarkers', objectName: 'Cover art'});
  text(s, 'MAIB MGT 204 · DESIGN THINKING · WEEK 12', {x: M, y: 1.7, w: 5.8, h: 0.4, fontSize: 13, bold: true, color: C.accent4, charSpacing: 3, objectName: 'Eyebrow'});
  s.addText('ResumeLoop', {placeholder: 'title'});
  s.addText('Helping working learners find the one right next task after a missed class', {placeholder: 'body'});
  text(s, [{text: 'An AI-assisted design thinking solution for UN SDG 4, Quality Education', options: {breakLine: true}},
    {text: 'Krishna Mathur · SP Jain School of Global Management, Dubai', options: {breakLine: true}},
    {text: 'Live prototype: resumeloop-demo.vercel.app', options: {color: C.accent4, bold: true}}],
  {x: M, y: 5.35, w: 5.8, h: 1.3, fontSize: 14, color: C.accent6, paraSpaceAfter: 4, objectName: 'Byline'});
  s.addNotes('Open with the moment every working learner knows: you miss one session, and when you come back the course has moved. ResumeLoop is my design thinking response to that moment, framed under SDG 4. Everything you will see runs live at the address on screen; the data in it is fictional, and I will be clear throughout about what is built and what still needs real fieldwork.');

  // ---------- 2. Problem ----------
  pres.addSection({title: 'Context'});
  s = content('Coming back after a missed class is a design problem', 'Context');
  framed(s, ART('initial-hero-dusk-road-concept'), M, 1.55, 5.5, 3.75, 'Problem art', 'A learner with a backpack looks along a path of stones, the nearest one glowing');
  chip(s, 'HYPOTHESES · TO TEST IN FIELDWORK', 6.75, 1.55, 3.6, 'Hypothesis chip');
  points(s, [
    {h: 'Rebuilding what changed takes effort', b: 'Tasks, dates and versions sit in several places, and they can disagree.'},
    {h: 'The right next task is unclear', b: 'Learners do not know which task fits the 30 or 60 minutes they actually have.'},
    {h: 'Asking for help feels costly', b: 'Some people stay quiet and fall further behind.'},
  ], 6.75, 2.25, 5.95, 1.15, 'Problem');
  text(s, 'Grounded in persistence research: Tinto (1975) on dropout as weakening integration over time; Kara et al. (2019), a review of 36 studies of adult distance learners.',
    {x: M, y: 5.6, w: 12.1, h: 0.8, fontSize: 13, italic: true, color: C.accent5, objectName: 'Problem sources'});
  s.addNotes('These are hypotheses, not findings. The literature says interruptions matter and that adult learners face interacting personal, external and programme barriers. It does not tell us that this happens in MAIB or that ResumeLoop helps. That is exactly what the fieldwork plan at the end is for.');

  // ---------- 3. SDG 4 ----------
  s = content('Why it matters: SDG 4, Quality Education', 'Context');
  framed(s, ART('sdg4-lifelong-learning'), M, 1.5, 5.0, 3.75, 'SDG art', 'Learners of different ages walk their own glowing paths towards one open book');
  [{t: 'Target 4.3', b: 'Equal access for all women and men to affordable, quality technical, vocational and tertiary education, including university.'},
   {t: 'Target 4.4', b: 'By 2030, substantially increase the number of youth and adults with relevant skills for employment, decent jobs and entrepreneurship.'}]
    .forEach((c, i) => {
      const y = 1.5 + i * 1.65;
      card(s, 6.2, y, 6.53, 1.45, `Target card ${i + 1}`);
      text(s, [{text: c.t, options: {bold: true, color: C.accent1, fontSize: 18, breakLine: true}}, {text: c.b, options: {fontSize: 15}}],
        {x: 6.45, y: y + 0.17, w: 6.05, h: 1.15, objectName: `Target ${i + 1}`});
    });
  card(s, 6.2, 4.85, 6.53, 0.95, 'Impact card', C.accent6);
  ember(s, 6.45, 5.2, 'Impact dot', C.accent2);
  text(s, [{text: 'Our claim: ', options: {bold: true}}, {text: 'a learner who can recover from a missed session is more likely to stay and finish. It is a hypothesis until the pilot measures it.'}],
    {x: 6.9, y: 4.97, w: 5.65, h: 0.75, fontSize: 14, valign: 'middle', objectName: 'Impact claim'});
  text(s, 'Source: United Nations, Sustainable Development Goal 4, targets 4.3 and 4.4 (sdgs.un.org/goals/goal4).', {x: M, y: 6.15, w: 12, h: 0.4, fontSize: 11, color: C.accent5, objectName: 'SDG source'});
  s.addNotes('Two targets fit: 4.3 is about access to tertiary education, 4.4 about the skills people finish with. I am careful here: the link from recovery to persistence is a hypothesis, and I will only claim an SDG effect if the pilot measures one.');

  // ---------- 4. Process ----------
  pres.addSection({title: 'Process'});
  s = content('Six stops on the design thinking journey', 'Process');
  const stops = [
    ['Empathise', 'stop-empathise', 'Interviews and guided tours, consent first', 'Ready to run'],
    ['Define', 'stop-define', 'Themes traced to quotes; points of view; Hills', 'Board built'],
    ['Ideate', 'stop-ideate', 'How might we, Crazy 8s, three alternatives scored', 'Tools built'],
    ['Prototype', 'stop-prototype', 'Journey, coach, studio and pilot, live', 'Live on Vercel'],
    ['Test', 'stop-test', 'Frozen protocol, rounds of five', 'Ready to run'],
    ['Impact', 'stop-impact', 'SDG 4 hypothesis, measured by the pilot', 'Pilot next'],
  ];
  const cw = (W - 2 * M - 5 * 0.22) / 6;
  stops.forEach(([t, art, d, st], i) => {
    const x = M + i * (cw + 0.22), y = 1.55;
    card(s, x, y, cw, 4.45, `Stop ${i + 1} card`);
    s.addImage({path: ART(art), x: x + 0.1, y: y + 0.1, w: cw - 0.2, h: (cw - 0.2) * 3 / 4, sizing: {type: 'cover', w: cw - 0.2, h: (cw - 0.2) * 3 / 4}, altText: `${t} illustration`, objectName: `Stop ${i + 1} art`});
    text(s, `${i + 1}`, {x: x + 0.18, y: y + 1.5, w: 0.5, h: 0.4, fontSize: 13, bold: true, color: C.accent1, objectName: `Stop ${i + 1} number`});
    text(s, t, {x: x + 0.18, y: y + 1.85, w: cw - 0.3, h: 0.45, fontSize: 18, bold: true, fontFace: 'Cambria', objectName: `Stop ${i + 1} title`});
    text(s, d, {x: x + 0.18, y: y + 2.35, w: cw - 0.32, h: 1.35, fontSize: 13, color: C.text2, objectName: `Stop ${i + 1} text`});
    chip(s, st.toUpperCase(), x + 0.14, y + 3.85, cw - 0.28, `Stop ${i + 1} status`, i < 4 ? C.accent6 : 'FFF1D6', i < 4 ? C.accent1 : C.accent3);
  });
  s.addNotes('This is the course process, and the order of the rest of the talk. The status chips are honest: the first four are built and usable; Test and Impact are designed and waiting for real participants.');

  // ---------- 5. Empathise ----------
  s = content('Empathise: listen before building', 'Process');
  points(s, [
    {h: '6 interviews, 25 minutes each', b: '4 working learners, at least one who recently missed a session, and 2 coordinators.'},
    {h: 'A guided tour of today\'s catch-up', b: 'How they find the next task now, with private details hidden.'},
    {h: 'Consent before data', b: 'An interview becomes research data only after consent is recorded; emails and phone numbers are refused.'},
    {h: 'Code real quotes, not summaries', b: 'AI may suggest codes; a person accepts or rejects every one.'},
  ], M, 1.6, 5.4, 1.15, 'Empathise');
  framed(s, SHOT('05-empathy-studio'), 6.3, 1.5, 6.43, 4.02, 'Empathy studio screenshot', 'Empathy studio with notes, codes and an empathy map, on fictional examples');
  chip(s, 'STATUS: SCHEDULED, NOT YET RUN', 6.3, 5.75, 3.9, 'Empathise status', 'FFF1D6', C.accent3);
  s.addNotes('The instruments are written and the tooling is live. What is not done yet is the fieldwork itself; I will not show invented interviews. The screen shows the empathy studio on clearly labelled fictional examples.');

  // ---------- 6. Define ----------
  s = content('Define: every theme traces back to a quote', 'Process');
  framed(s, SHOT('06-synthesis'), M, 1.5, 6.6, 4.13, 'Synthesis screenshot', 'Synthesis board with an evidence trace and evidence-quality checks');
  const phases = [['Familiarise', 'Read each consented note twice'], ['Code', 'Exact quotes, accepted by a person'], ['Cluster', 'Drag codes into candidate themes'],
    ['Review', 'Check against quotes; keep negative cases'], ['Name', 'Point of view and a Hill per theme']];
  phases.forEach(([h, b], i) => {
    const y = 1.55 + i * 0.86;
    ember(s, 7.55, y + 0.12, `Phase ${i + 1} dot`);
    text(s, [{text: `${h}  `, options: {bold: true}}, {text: b, options: {color: C.text2}}], {x: 8.0, y, w: 4.73, h: 0.7, fontSize: 15, objectName: `Phase ${i + 1}`});
  });
  text(s, 'Reflexive thematic analysis, after Braun and Clarke (2006).', {x: 7.55, y: 5.95, w: 5.2, h: 0.4, fontSize: 12, italic: true, color: C.accent5, objectName: 'Define source'});
  s.addNotes('Analysis follows Braun and Clarke. The board keeps an evidence trace from theme to code to quote to participant, and flags weak evidence, for example a theme resting on one person.');

  // ---------- 7. Ideate ----------
  s = content('Ideate: we kept the cheapest option on the table', 'Process');
  const alts = [
    ['Fix the LMS checklist', 'Cheapest, already where learners are', 'Cannot plan around the time you have or show what changed'],
    ['Coordinator brief', 'Human, trusted, flexible', 'Coordinator time per learner; does not scale'],
    ['ResumeLoop plan', 'Plans to your time, shows changes, cites sources', 'New tool to adopt; needs authorised course data'],
  ];
  alts.forEach(([t, pro, con], i) => {
    const x = M + i * 4.12, y = 1.55, w = 3.9;
    card(s, x, y, w, 3.55, `Alternative ${i + 1} card`);
    text(s, t, {x: x + 0.3, y: y + 0.3, w: w - 0.6, h: 0.5, fontSize: 20, bold: true, fontFace: 'Cambria', color: i === 2 ? C.accent1 : C.text1, objectName: `Alternative ${i + 1} title`});
    ember(s, x + 0.3, y + 1.08, `Alternative ${i + 1} pro dot`, C.accent2);
    text(s, [{text: 'For  ', options: {bold: true, color: C.accent2}}, {text: pro}], {x: x + 0.72, y: y + 0.98, w: w - 1.0, h: 1.2, fontSize: 15, objectName: `Alternative ${i + 1} pro`});
    ember(s, x + 0.3, y + 2.38, `Alternative ${i + 1} con dot`, C.accent3);
    text(s, [{text: 'Against  ', options: {bold: true, color: C.accent3}}, {text: con}], {x: x + 0.72, y: y + 2.28, w: w - 1.0, h: 1.4, fontSize: 15, objectName: `Alternative ${i + 1} con`});
  });
  text(s, 'Participants score all three in the co-design session (Crazy 8s, one vote each). If the checklist wins, that is a valid result.',
    {x: M, y: 5.4, w: 12.1, h: 0.6, fontSize: 15, italic: true, color: C.text2, objectName: 'Ideate note'});
  s.addNotes('Design thinking punishes falling in love with the first idea. So the cheapest alternative, improving the LMS checklist, stays in every comparison, and the participants, not me, score the three.');

  // ---------- 8. Prototype: journey ----------
  pres.addSection({title: 'Prototype'});
  s = content('Prototype: your next task, lit on the road', 'Prototype');
  framed(s, SHOT('01-journey-3d'), M, 1.45, 7.9, 4.94, 'Journey screenshot', 'The 3D road with done tasks behind and the next task glowing, beside the time-budget panel');
  points(s, [
    {h: 'Done tasks sit behind you', b: 'The next feasible task glows; locked ones wait.'},
    {h: 'Plan to the time you have', b: 'Change 60 minutes to 30 and the plan re-orders.'},
    {h: 'A planner you can trust', b: 'Respects prerequisites; never guesses an unknown duration.'},
    {h: 'Works without 3D', b: 'The same plan as an accessible list and by keyboard.'},
  ], 8.85, 1.55, 3.88, 1.2, 'Journey');
  s.addNotes('This is the live journey. The road is not decoration: position encodes progress, and the glow is the one decision the learner needs. The planner underneath is deterministic and tested; AI never decides what you should do.');

  // ---------- 9. Prototype: coach ----------
  s = content('A coach that cites its sources, or says "I don\'t know"', 'Prototype');
  framed(s, SHOT('04-coach'), M, 1.45, 7.3, 4.56, 'Coach screenshot', 'The coach answering a question with a cited course passage');
  points(s, [
    {h: 'Answers only from the course', b: 'Every claim cites a retrieved passage.'},
    {h: 'Facts must match the source', b: 'Dates and durations must appear in what it cites.'},
    {h: 'No invented obligations', b: '"Cancelled", "optional", "extension" need a source that says so.'},
    {h: 'Declines, then routes to a person', b: 'Off-topic questions get an offer to ask the coordinator.'},
  ], 8.25, 1.55, 4.48, 1.2, 'Coach');
  s.addNotes('The model only phrases. Code checks every answer: citations must be real, dates and durations must be in the cited text, and words that change what a learner must do need a source. If any check fails, the coach declines and offers to ask the coordinator. It runs on a local open model; nothing is sent to a cloud AI.');

  // ---------- 10. Evaluation ----------
  pres.addSection({title: 'Evidence and quality'});
  s = content('The AI was tested before anyone relies on it', 'Evidence and quality');
  const stats = [['97.6%', 'of answerable questions answered (40 of 41)'], ['97.5%', 'of answers cite the right passage'], ['100%', 'of off-topic questions declined (10 of 10)'], ['100%', 'of injection attempts resisted (8 of 8)']];
  stats.forEach(([n, l], i) => {
    const x = M + i * 3.1, w = 2.85;
    card(s, x, 1.6, w, 2.6, `Stat ${i + 1} card`);
    text(s, n, {x: x + 0.25, y: 1.85, w: w - 0.5, h: 1.1, fontSize: 48, bold: true, fontFace: 'Cambria', color: i < 2 ? C.accent1 : C.accent2, objectName: `Stat ${i + 1} value`});
    text(s, l, {x: x + 0.25, y: 3.05, w: w - 0.5, h: 1.0, fontSize: 15, color: C.text2, objectName: `Stat ${i + 1} label`});
  });
  card(s, M, 4.55, 12.13, 1.5, 'Method card', C.accent6);
  text(s, [{text: 'How: ', options: {bold: true}}, {text: '59-question gold set (41 answerable, 10 out of scope, 8 prompt injections) on the fictional course; local qwen2.5:7b with bge-m3 embeddings; temperature 0 and a fixed seed, so two runs gave identical results. CI replays the recorded run on every change.', options: {breakLine: true}},
    {text: 'Limits: ', options: {bold: true}}, {text: 'a small, fictional set. These are engineering checks, not evidence about real learners. No answer was wrong; one correct answer cites a neighbouring passage.'}],
  {x: M + 0.3, y: 4.72, w: 11.5, h: 1.2, fontSize: 14, paraSpaceAfter: 6, objectName: 'Method'});
  s.addNotes('I built a gold set before trusting the coach. The interesting failures were found by this test: the model once repeated an injected date and once claimed a quiz was cancelled. Both were fixed with deterministic guards, not prompt tweaks. These numbers are on fictional data; I present them as engineering quality, not learning outcomes.');

  // ---------- 11. Test plan ----------
  s = content('Test: a frozen protocol, in rounds of five', 'Evidence and quality');
  const steps = [['Freeze', 'Tasks, answer key and success rules fixed and fingerprinted (SHA-256) before any session.'],
    ['Round 1', 'Five people do the same two tasks the current way and with ResumeLoop, in alternating order.'],
    ['Fix', 'Change only what round 1 found; log each version and the feedback behind it.'],
    ['Round 2', 'Five more people. Report medians, ranges and failures, never just the wins.']];
  steps.forEach(([h, b], i) => {
    const y = 1.55 + i * 1.12;
    text(s, `${i + 1}`, {x: M, y, w: 0.5, h: 0.6, fontSize: 28, bold: true, fontFace: 'Cambria', color: C.accent1, objectName: `Step ${i + 1} number`});
    text(s, [{text: h, options: {bold: true, breakLine: true}}, {text: b, options: {color: C.text2, fontSize: 14}}], {x: M + 0.6, y, w: 5.1, h: 1.0, fontSize: 17, objectName: `Step ${i + 1}`});
  });
  framed(s, SHOT('08-experiments'), 6.55, 1.5, 6.18, 3.86, 'Experiment lab screenshot', 'Experiment lab with a protocol ready to freeze');
  text(s, 'Measures: unaided success, seconds, wrong actions, help needed, ease 1 to 7. Five people find most usability problems in a round (Nielsen, 2000); they cannot show statistical significance, and we say so.',
    {x: 6.55, y: 5.55, w: 6.18, h: 0.95, fontSize: 13, color: C.accent5, objectName: 'Test note'});
  s.addNotes('The protocol is frozen and fingerprinted before any session so I cannot quietly tune the test. Small rounds follow Nielsen: fix between rounds. The exact sign test in the lab is reported with its small-sample caveat.');

  // ---------- 12. Pilot ----------
  s = content('A real pilot, with no server and no names', 'Evidence and quality');
  framed(s, ART('pilot-how-it-works'), M, 1.45, 8.0, 3.45, 'Pilot art', 'A coordinator sends one course file to three learners; their progress files come back');
  points(s, [
    {h: 'Coordinator shares an approved course file', b: 'Checked with the same rules as the server; permission confirmed.'},
    {h: 'Learners plan on their own devices', b: 'Nothing leaves the browser.'},
    {h: 'Progress returns as files, under codes', b: 'The coordinator sees who is behind and what they ask.'},
  ], 8.95, 1.55, 3.78, 1.15, 'Pilot');
  card(s, M, 5.2, 12.13, 1.2, 'Pilot plan card', C.accent6);
  text(s, [{text: 'Plan: ', options: {bold: true}}, {text: '3 to 5 learners for one to two weeks on a course I am allowed to share. Measure time to the first correct task and questions the coordinator no longer had to answer.'}],
    {x: M + 0.3, y: 5.33, w: 11.5, h: 0.95, fontSize: 15, valign: 'middle', objectName: 'Pilot plan'});
  s.addNotes('The pilot runs on the public site today: the coordinator loads a course file, learners load the same file, and progress comes back as files under learner codes, never names. This is how I will collect real-use evidence without hosting anyone\'s data.');

  // ---------- 13. Ethics ----------
  s = content('Ethics and privacy are designed in, not added on', 'Evidence and quality');
  framed(s, ART('privacy-local'), M, 1.5, 4.9, 3.68, 'Privacy art', 'A person works at a laptop inside a small lit house, their papers beside them');
  const eth = [['Consent first', 'Notes become data only after recorded consent'], ['No personal data', 'Emails and phone numbers are refused in notes'],
    ['Humans decide', 'AI suggests codes; people accept; messages need approval'], ['Transparent AI', 'Every call logged with a prompt hash, never the text'],
    ['Separated data', 'Accounts and organisations, with cross-tenant denial tests'], ['Local by default', 'Local model; nothing sent to a cloud AI']];
  eth.forEach(([h, b], i) => {
    const x = 5.85 + (i % 2) * 3.47, y = 1.5 + Math.floor(i / 2) * 1.62, w = 3.3;
    card(s, x, y, w, 1.45, `Ethics card ${i + 1}`);
    ember(s, x + 0.25, y + 0.28, `Ethics ${i + 1} dot`, i % 2 ? C.accent2 : C.accent1);
    text(s, [{text: h, options: {bold: true, breakLine: true}}, {text: b, options: {fontSize: 13, color: C.text2}}], {x: x + 0.65, y: y + 0.2, w: w - 0.85, h: 1.15, fontSize: 15, objectName: `Ethics ${i + 1}`});
  });
  s.addNotes('Ethics is in the product, not a slide. Consent gates the data, personal identifiers are refused, a person approves every AI suggestion and every message, and the AI log is visible on the ethics screen.');

  // ---------- 14. Engineering quality ----------
  s = content('Built to be checked, not just shown', 'Evidence and quality');
  const q = [['107', 'API tests, including cross-tenant denial'], ['146 × 3', 'browser checks in Chromium, WebKit and Firefox'], ['0', 'accessibility violations in 112 scans (WCAG 2.2 AA)'],
    ['19', 'end-to-end checks of the browser pilot'], ['60 / 60', 'planner cases match between Python and the browser'], ['18.7 ms', 'p95 response time at about 1,100 requests a second']];
  q.forEach(([n, l], i) => {
    const x = M + (i % 3) * 4.12, y = 1.55 + Math.floor(i / 3) * 2.35, w = 3.9;
    card(s, x, y, w, 2.1, `Quality card ${i + 1}`);
    text(s, n, {x: x + 0.3, y: y + 0.25, w: w - 0.6, h: 0.95, fontSize: 40, bold: true, fontFace: 'Cambria', color: i === 2 ? C.accent2 : C.accent1, objectName: `Quality ${i + 1} value`});
    text(s, l, {x: x + 0.3, y: y + 1.2, w: w - 0.6, h: 0.75, fontSize: 15, color: C.text2, objectName: `Quality ${i + 1} label`});
  });
  text(s, 'Every push runs all of it in GitHub Actions; the live site deploys only from that branch.', {x: M, y: 6.35, w: 12, h: 0.4, fontSize: 13, italic: true, color: C.accent5, objectName: 'Quality note'});
  s.addNotes('A prototype for a design course still needs to be trustworthy. Every change is tested automatically, including accessibility in light and dark at phone and desktop widths, and the same suite runs in three browser engines.');

  // ---------- 15. Everywhere ----------
  s = content('Works on a laptop at night and a phone on the train', 'Evidence and quality');
  framed(s, SHOT('15-journey-dark'), M, 1.45, 7.6, 4.75, 'Dark mode screenshot', 'The journey in dark mode');
  framed(s, SHOT('16-phone-journey'), 8.55, 1.45, 2.0, 4.75, 'Phone journey screenshot', 'The journey on a phone');
  framed(s, SHOT('17-phone-coach'), 10.73, 1.45, 2.0, 4.75, 'Phone coach screenshot', 'The coach on a phone');
  text(s, 'Light, dark and system themes; layouts checked from 320 px phones to 1440 px desktops.', {x: M, y: 6.35, w: 12, h: 0.4, fontSize: 13, italic: true, color: C.accent5, objectName: 'Everywhere note'});
  s.addNotes('Working learners catch up in the gaps of the day, often on a phone. Every screen works from a small phone to a desktop, in light and dark.');

  // ---------- 16. Limits and next ----------
  pres.addSection({title: 'Close'});
  s = content('What is not proven yet, and the plan to prove it', 'Close');
  card(s, M, 1.5, 5.3, 4.85, 'Limits card');
  text(s, 'Not proven yet', {x: M + 0.3, y: 1.7, w: 4.7, h: 0.5, fontSize: 20, bold: true, fontFace: 'Cambria', objectName: 'Limits title'});
  text(s, [
    {text: 'No participants or results yet: all data is fictional', options: {bullet: true, breakLine: true}},
    {text: 'The AI test set is small and fictional', options: {bullet: true, breakLine: true}},
    {text: 'No screen-reader or real-device sessions yet', options: {bullet: true, breakLine: true}},
    {text: 'Not hosted for real data: prototype, not a product', options: {bullet: true}}],
  {x: M + 0.3, y: 2.35, w: 4.7, h: 3.8, fontSize: 16, paraSpaceAfter: 10, objectName: 'Limits list'});
  const days = [['Days 1–2', 'Recruit 4 learners and 2 coordinators'], ['Days 3–5', '6 interviews and guided tours'], ['Days 6–7', 'Thematic analysis; points of view'],
    ['Day 8', 'Co-design session; score 3 alternatives'], ['Days 9–11', 'Freeze protocol; usability round 1'], ['Days 10–14', 'Browser pilot with 3–5 learners'], ['Day 14', 'Evidence report and reflection']];
  text(s, 'Two-week fieldwork sprint, about 10 hours', {x: 6.3, y: 1.5, w: 6.4, h: 0.5, fontSize: 20, bold: true, fontFace: 'Cambria', objectName: 'Sprint title'});
  days.forEach(([d, t], i) => {
    const y = 2.15 + i * 0.6;
    ember(s, 6.35, y + 0.1, `Sprint ${i + 1} dot`, i === days.length - 1 ? C.accent2 : C.accent1);
    text(s, [{text: `${d}   `, options: {bold: true, color: C.accent1}}, {text: t}], {x: 6.8, y, w: 5.9, h: 0.5, fontSize: 15, valign: 'middle', objectName: `Sprint ${i + 1}`});
  });
  s.addNotes('Here is the honest gap. Nothing on these slides is evidence about real learners yet. The sprint closes that gap in about ten hours over two weeks, and each step produces a specific rubric item.');

  // ---------- 17. Recommendation ----------
  s = pres.addSlide({masterName: 'Title dark', sectionTitle: 'Close'});
  s.addImage({path: ART('stop-closing'), x: 6.55, y: 0, w: W - 6.55, h: 7.5, sizing: {type: 'cover', w: W - 6.55, h: 7.5}, altText: 'The ember path fully lit, ending at a glowing stone on a hilltop', objectName: 'Closing art'});
  text(s, 'RECOMMENDATION', {x: M, y: 1.0, w: 5.8, h: 0.4, fontSize: 13, bold: true, color: C.accent4, charSpacing: 3, objectName: 'Closing eyebrow'});
  text(s, 'Test it with real learners before building more', {x: M, y: 1.5, w: 5.7, h: 1.7, fontSize: 36, bold: true, fontFace: 'Cambria', color: C.background1, objectName: 'Closing title'});
  [['Approve', 'consented fieldwork and a two-week browser pilot'], ['Pilot', 'one coordinator and 3 to 5 learners on a course I may share'], ['Measure', 'time to the first correct task, and questions avoided']]
    .forEach(([h, b], i) => {
      const y = 3.55 + i * 0.95;
      ember(s, M, y + 0.08, `Ask ${i + 1} dot`, C.accent4);
      text(s, [{text: `${h}  `, options: {bold: true, color: C.background1}}, {text: b, options: {color: C.accent6}}], {x: M + 0.45, y, w: 5.3, h: 0.8, fontSize: 17, objectName: `Ask ${i + 1}`});
    });
  text(s, 'Thank you · resumeloop-demo.vercel.app · github.com/krish2105/ResumeLoop-term-4', {x: M, y: 6.6, w: 5.9, h: 0.5, fontSize: 12, color: C.accent4, objectName: 'Thanks'});
  s.addNotes('My recommendation is not "adopt ResumeLoop". It is: let me test it properly. Approve consented fieldwork and a small pilot, and judge it on two numbers: how fast a returning learner finds the right task, and how many questions the coordinator no longer has to answer.');

  // ---------- 18. References ----------
  s = content('References', 'Close');
  const refs = [
    'Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. Qualitative Research in Psychology, 3(2), 77–101. https://doi.org/10.1191/1478088706qp063oa',
    'Brown, T. (2008, June). Design thinking. Harvard Business Review. https://hbr.org/2008/06/design-thinking',
    'IDEO.org. (2015). The field guide to human-centered design (1st ed.). IDEO.org. ISBN 978-0-9914063-1-9',
    'Kara, M., Erdoğdu, F., Kokoç, M., & Cagiltay, K. (2019). Challenges faced by adult learners in online distance education: A literature review. Open Praxis, 11(1), 5–22. https://doi.org/10.5944/openpraxis.11.1.929',
    'Liedtka, J. (2018, September–October). Why design thinking works. Harvard Business Review. https://hbr.org/2018/09/why-design-thinking-works',
    'Nielsen, J. (2000, March 18). Why you only need to test with 5 users. Nielsen Norman Group.',
    'Tinto, V. (1975). Dropout from higher education: A theoretical synthesis of recent research. Review of Educational Research, 45(1), 89–125. https://doi.org/10.3102/00346543045001089',
    'United Nations. (2015). Sustainable Development Goal 4, targets 4.3 and 4.4. https://sdgs.un.org/goals/goal4',
  ];
  text(s, refs.map((r, i) => ({text: r, options: {breakLine: i < refs.length - 1}})), {x: M, y: 1.45, w: 12.1, h: 4.9, fontSize: 13, paraSpaceAfter: 7, color: C.text2, objectName: 'Reference list'});
  text(s, 'Illustrations generated with ChatGPT (OpenAI) for ResumeLoop; they illustrate the process and are not research photos. Screenshots: the live prototype, fictional data.',
    {x: M, y: 6.4, w: 12.1, h: 0.45, fontSize: 11, italic: true, color: C.accent5, objectName: 'Credits'});
  s.addNotes('All references were checked against the publisher, the DOI or a library record.');

  await pres.writeFile({fileName: OUT});
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})().catch(e => { console.error(e); process.exit(1); });
