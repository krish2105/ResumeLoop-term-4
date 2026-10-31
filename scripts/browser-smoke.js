// Run with both local services up and a throwaway DEMO_DB_PATH (see PROGRESS.md):
//   npx --yes --package @playwright/cli playwright-cli --session resumeloop open http://127.0.0.1:3000
//   npx --yes --package @playwright/cli playwright-cli --session resumeloop run-code "$(cat scripts/browser-smoke.js)"
// Synthetic engineering verification only; not participant usability evidence.
async (page) => {
  const BASE = 'http://127.0.0.1:3000';
  const API = 'http://127.0.0.1:8014';
  const AI = 150000;
  const checks = [];
  const check = (condition, label) => { if (!condition) throw Error('FAILED: ' + label); checks.push(label.split(': ')[0]); };
  const go = async path => { await page.goto(BASE + path); await page.locator('.hero, .journey2, .deckWrap').first().waitFor({timeout: 30000}); };
  const settle = () => page.evaluate(async () => { await Promise.all(document.getAnimations().map(a => a.finished.catch(() => null))); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
  const text = loc => loc.innerText();
  const toast = page.locator('.toast');
  const saw = async expected => {  // names what was on screen instead of a bare timeout
    try { await toast.filter({hasText: expected}).waitFor({timeout: 20000}); }
    catch { throw Error(`FAILED: expected toast ${expected}; saw ${JSON.stringify(await toast.allInnerTexts())} and alerts ${JSON.stringify(await page.getByRole('alert').allInnerTexts())}`); }
  };
  await page.addInitScript(() => { window.confirm = () => true; });
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.setViewportSize({width: 1440, height: 1000});
  await page.request.delete(API + '/api/learner/progress');
  const ai = await (await page.request.get(API + '/api/ai/status')).json();

  // ---------- Journey: 3D road + accessible list ----------
  await go('/');
  // Headless browsers without a GPU (Firefox on CI) have no WebGL: then the journey must show its 2D fallback.
  const webgl = await page.evaluate(() => { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); });
  const road = webgl ? page.locator('.stage3d canvas') : page.getByRole('heading', {name: '3D view unavailable'});
  await road.waitFor({timeout: 30000});
  check(true, webgl ? '3D canvas renders on the journey' : 'Without WebGL the journey shows the 2D fallback and list link');
  await page.locator('#budget-help').filter({hasText: 'tasks lit'}).waitFor();
  const stars = page.getByRole('region', {name: 'Stars on your road'}).getByRole('button');
  check(await stars.count() >= 10, 'Every course task is listed as a focusable star button');
  const help = page.locator('#budget-help');
  await help.filter({hasText: 'tasks lit'}).waitFor();
  const before = await text(help);
  const slider = page.getByRole('slider');
  await slider.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
  await page.getByRole('status').filter({hasText: 'Saved'}).waitFor();
  check((await text(help)) !== before && (await slider.inputValue()) === '90', 'Keyboard changes the time budget, re-plans and autosaves');
  await page.screenshot({path: 'output/playwright/journey-desktop-dark.png'});
  const next = await text(page.getByRole('region', {name: 'Selected task'}).getByRole('heading'));
  const putDone = page.waitForResponse(r => r.url().includes('/api/learner/progress') && r.request().method() === 'PUT');
  await page.getByRole('button', {name: 'Mark complete'}).click();
  await putDone;
  await page.reload(); await page.locator('.journey2').waitFor();
  await help.filter({hasText: 'tasks lit'}).waitFor();
  check(await stars.filter({hasText: next}).filter({hasText: 'Completed'}).count() === 1, 'Completed task persists after refresh');
  const saved = await (await page.request.get(API + '/api/learner/progress')).json();
  await page.request.put(API + '/api/learner/progress', {data: {expected_version: saved.version, state: saved.state}});
  await slider.focus(); await page.keyboard.press('ArrowLeft');
  await page.getByText('Changed in another tab').waitFor();
  check(true, 'Stale tab write is refused and asks for a reload');
  await page.getByRole('button', {name: 'Reload'}).click();
  await page.getByRole('status').filter({hasText: 'Progress loaded'}).waitFor();
  check(await page.getByRole('link', {name: /The course changed/}).isVisible(), 'Course-change banner links to the digest');
  await stars.nth(0).focus();
  // Safari moves Tab only through form fields unless Option is held; Option+Tab is its "every item" key.
  const macSafari = page.context().browser()?.browserType().name() === 'webkit' && await page.evaluate(() => /Mac/.test(navigator.platform));
  await page.keyboard.press(macSafari ? 'Alt+Tab' : 'Tab');
  check(await stars.nth(1).evaluate(el => el === document.activeElement && el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), 'Tab moves between star buttons with a visible focus ring');

  // ---------- List view twin ----------
  await go('/plan');
  await page.getByRole('heading', {name: 'Planned now, in order'}).waitFor();
  const boxes = page.getByRole('checkbox', {name: /^Completed:/});
  check(await boxes.count() >= 10, 'List view shows every task with a completion checkbox');
  check(await page.getByRole('cell', {name: /Needs .* first/}).count() > 0, 'List view explains locked tasks');

  // ---------- What changed ----------
  await go('/digest');
  await page.getByRole('heading', {name: 'In plain English'}).waitFor({timeout: AI});
  check(await page.getByRole('region', {name: /Exact changes/}).locator('li').count() === 7, 'Digest lists all 7 computed changes as the source of truth');
  check(await page.locator('.digestList li').count() >= 1, 'Digest shows a plain-English summary (' + (ai.available ? 'live model' : 'fallback') + ')');
  await page.getByRole('button', {name: /Got it, use v2/}).click();
  await page.getByRole('button', {name: 'Marked as seen'}).waitFor();
  check(true, 'Marking the digest as seen updates progress');

  // ---------- Coach ----------
  await go('/coach');
  await page.getByRole('button', {name: 'Ask'}).click();
  check((await text(page.locator('#q-error'))).includes('at least 3 characters'), 'Empty coach question shows an inline error');
  await page.getByRole('button', {name: 'What goes in an empathy map?'}).first().click();
  const lastBot = page.locator('.turns > li').last().locator('.bubble.bot');
  await lastBot.locator('.aiBadge').waitFor({timeout: AI});
  check(await lastBot.locator('.chip').count() > 0, 'Coach answer carries at least one source citation');
  await page.getByRole('textbox', {name: 'Your question'}).fill('What is the parking fee at the city zoo?');
  await page.getByRole('button', {name: 'Ask'}).click();
  await page.locator('.turns > li').last().locator('.aiBadge').waitFor({timeout: AI});
  check((await text(page.locator('.turns > li').last())).includes("can't find this in the course sources"), 'Coach abstains on an off-topic question');
  check(await page.locator('.turns > li').last().getByRole('link', {name: 'Ask the coordinator'}).isVisible(), 'Abstention offers a coordinator escalation');

  // ---------- Coordinator queue ----------
  await page.locator('.turns > li').last().getByRole('link', {name: 'Ask the coordinator'}).click();
  await page.waitForURL(/escalations/);
  await page.getByRole('button', {name: 'Draft the message'}).click();
  await page.getByRole('textbox', {name: 'Subject'}).waitFor({timeout: AI});
  await page.getByRole('button', {name: 'Approve and queue'}).click();
  check((await text(toast)).includes('Tick the approval box first'), 'Queue refuses an unapproved message');
  await page.getByRole('checkbox', {name: /I have read this message/}).check();
  await page.getByRole('button', {name: 'Approve and queue'}).click();
  await saw('Queued locally. Nothing was sent anywhere.');
  check(true, 'Approved message is queued locally and never sent');
  await page.getByRole('checkbox', {name: /Coordinator view/}).check();
  await page.getByRole('textbox', {name: 'Answer'}).first().fill('Fictional answer: use 26 November.');
  await page.getByRole('button', {name: 'Record answer'}).first().click();
  await saw('Answer recorded.');
  check(await page.locator('.status.q-answered').count() >= 1, 'Coordinator role-play can answer a queued question');

  // ---------- Empathy studio ----------
  await go('/studio/empathy');
  await page.getByRole('button', {name: 'Load fictional examples'}).click();
  await page.getByText('Fictional examples are loaded.').first().waitFor();
  check(true, 'Fictional examples load with a visible banner');
  await page.getByRole('textbox', {name: 'Participant code'}).fill('P90');
  await page.getByRole('textbox', {name: 'Anonymised note'}).fill('Smoke test note: call me on +971 50 123 4567 about the quiz.');
  await page.getByRole('button', {name: 'Save note'}).click();
  check((await text(toast)).includes('participation consent'), 'Notes need recorded participation consent');
  await page.getByRole('checkbox', {name: 'Agreed to take part'}).check();
  await page.getByRole('checkbox', {name: /anonymised note analysis/}).check();
  await page.getByRole('button', {name: 'Save note'}).click();
  await saw('Remove emails and phone numbers');
  check(true, 'Privacy guard rejects a note with a phone number');
  await page.getByRole('textbox', {name: 'Anonymised note'}).fill('Smoke test note: I checked three places and none agreed on the date.');
  await page.getByRole('button', {name: 'Save note'}).click();
  await saw('Note saved.');
  check(true, 'A consented, anonymised note saves');
  await page.getByText('Add a code by hand').click();
  await page.getByRole('textbox', {name: 'Label'}).fill('Invented');
  await page.getByRole('textbox', {name: 'Exact quote from the note'}).fill('this sentence is not in the note');
  await page.getByRole('button', {name: 'Add code'}).click();
  await saw('copied exactly');
  check(true, 'A code quote that is not in the note is rejected');
  if (ai.available) {
    await page.getByRole('button', {name: 'Suggest codes with AI'}).click();
    await page.locator('.code.suggested').first().waitFor({timeout: AI});
    await page.locator('.code.suggested').first().getByRole('button', {name: 'Accept'}).click();
    await page.locator('.code.accepted').first().waitFor();
    check(true, 'Local AI suggests codes that a person accepts');
  }
  await page.getByRole('textbox', {name: 'Theme title'}).fill('Conflicting sources of truth');
  await page.getByRole('textbox', {name: 'Insight'}).fill('Returning learners lose time reconciling course sources that disagree');
  await page.getByRole('button', {name: 'Create theme'}).click();
  await saw('Theme created.');
  check(true, 'A theme is created from the empathy map');
  await page.screenshot({path: 'output/playwright/empathy-desktop.png', fullPage: true});

  // ---------- Ideate ----------
  await go('/studio/ideate');
  await page.getByRole('textbox', {name: 'Your name for votes and scores'}).fill('Smoke tester');
  const hmwBox = page.getByRole('textbox', {name: 'New How might we question'}).first();
  await hmwBox.fill('Why do dates change so often?');
  await hmwBox.locator('xpath=..').getByRole('button', {name: 'Add'}).click();
  await saw('How might we');
  check(true, 'A question that does not start with How might we is rejected');
  await hmwBox.fill('How might we show one trusted date?');
  await hmwBox.locator('xpath=..').getByRole('button', {name: 'Add'}).click();
  await saw('Question added.');
  await page.getByRole('textbox', {name: 'New idea'}).first().fill('Verified-date badge');
  await page.getByRole('button', {name: 'Add idea'}).first().click();
  await saw('Idea added.');
  await page.getByRole('button', {name: 'Vote', exact: true}).first().click();
  await page.getByRole('button', {name: 'Voted'}).first().waitFor();
  check(await page.getByRole('button', {name: 'Voted'}).first().isDisabled(), 'One vote per person per idea');
  await page.getByRole('combobox', {name: 'privacy score for resumeloop'}).selectOption('4');
  await page.locator('td', {hasText: 'avg 4.0'}).first().waitFor();
  check(true, 'Alternative scores are saved and averaged');

  // ---------- Experiment lab ----------
  await go('/studio/experiments');
  await page.getByRole('button', {name: 'Freeze protocol'}).click();
  await page.getByText(/Protocol SHA-256 [0-9a-f]{64}/).waitFor();
  check(true, 'Freezing the protocol records a SHA-256 fingerprint');
  await page.getByRole('button', {name: 'Start', exact: true}).first().click();
  await page.waitForTimeout(1300);
  await page.getByRole('button', {name: /^Stop/}).click();
  const secs = Number(await page.getByRole('spinbutton', {name: /^Seconds for/}).first().inputValue());
  check(secs >= 1 && secs < 10, 'Session timer records elapsed seconds');
  await page.getByRole('checkbox', {name: 'Unaided success'}).first().check();
  await page.getByRole('button', {name: 'Save session'}).click();
  await saw('Session saved.');
  check((await text(page.locator('section[aria-labelledby="res"]'))).includes('1 session(s)'), 'Results summarise the recorded session');

  // ---------- Ethics ----------
  await go('/studio/ethics');
  await page.getByRole('heading', {name: 'AI decision log'}).waitFor();
  await page.locator('section', {has: page.getByRole('heading', {name: 'AI decision log'})}).locator('tbody tr').first().waitFor();
  check(true, 'Ethics panel shows logged AI calls');

  // ---------- Story mode ----------
  await go('/story');
  const card = page.locator('.storyCard h2');
  await card.filter({hasText: 'Empathise'}).waitFor();
  await page.locator('.stage3d').click({position: {x: 40, y: 200}});
  await page.keyboard.press('ArrowRight');
  await card.filter({hasText: 'Define'}).waitFor();
  await page.getByRole('button', {name: 'Go to Impact · SDG 4'}).click();
  await card.filter({hasText: 'Impact'}).waitFor();
  check((await text(page.locator('.storyCard'))).includes('fictional') || (await text(page.locator('.storyCard'))).includes('hypothesis'), 'Story mode moves by keyboard and buttons and stays honest about evidence');
  await page.screenshot({path: 'output/playwright/story-desktop.png'});

  // ---------- Outline-aligned studio screens ----------
  const box = name => page.getByRole('textbox', {name: new RegExp('^' + name)});
  await go('/studio/observe');
  await page.getByRole('button', {name: 'Save observation'}).click();
  check((await text(page.locator('#obs-err'))).includes('Setting'), 'Observation form explains missing required fields');
  await box('Setting').fill('Train home, phone');
  await box('What happened').fill('Opened three apps before finding the quiz date.');
  await page.getByRole('combobox', {name: 'Who or where'}).selectOption('extreme-low');
  await page.getByRole('button', {name: 'Save observation'}).click();
  await saw('Observation saved.');
  await box('Persona label').fill('The night-shift learner');
  await page.getByRole('button', {name: 'Create persona'}).click();
  await page.getByText('Assumption: no evidence yet').waitFor();
  await page.locator('fieldset.consent').getByRole('checkbox').first().check();
  await box('Persona label').fill('The evidence-backed learner');
  await page.getByRole('button', {name: 'Create persona'}).click();
  await page.getByText('1 evidence links').waitFor();
  check(true, 'Personas are flagged as assumptions until linked to evidence');
  await go('/studio/define');
  await box('User').fill('A working learner'); await box('Needs a way to').fill('find the one next task'); await box('Because').fill('sources disagree');
  await page.getByRole('button', {name: 'Save statement'}).click();
  await page.getByText('needs a way to').first().waitFor();
  await page.getByRole('textbox', {name: 'Frame 1 caption'}).fill('Opens the app on the train');
  await page.locator('section', {has: page.getByRole('heading', {name: 'Storyboard'})}).getByRole('textbox', {name: 'Title'}).fill('Back on the train');
  await page.getByRole('button', {name: 'Save storyboard'}).click();
  await saw('Storyboard saved.');
  check(true, 'Point-of-view statement and storyboard save');
  await go('/studio/envision');
  await box('Who').fill('A returning learner'); await box('What they can do').fill('start the right next task'); await box('Wow').fill('within two minutes');
  await page.getByRole('button', {name: 'Add Hill'}).click();
  await page.locator('.hill').first().waitFor();
  check(true, 'Hill statement saves as who / what / wow');
  await go('/studio/journeys');
  await page.getByRole('textbox', {name: 'Title'}).fill('Returning today');
  await page.getByRole('button', {name: 'Save journey map'}).click();
  await page.locator('section[aria-label="Current journeys"] .stage').first().waitFor();
  check(true, 'Current journey map saves with its stages');
  await go('/studio/prototypes');
  await box('Version').fill('v0.4'); await box('Title').fill('Split layout');
  await page.getByRole('button', {name: 'Log version'}).click();
  await page.getByPlaceholder('What the tester said or did').fill('Bigger labels please');
  await page.getByRole('button', {name: 'Add feedback'}).click();
  await page.getByText('Bigger labels please').waitFor();
  check(true, 'Prototype version and tester feedback are logged');
  await go('/studio/ideate');
  await page.getByRole('button', {name: 'Start timer'}).click();
  await page.waitForTimeout(1200);
  check(/^7:5\d$/.test(await text(page.getByRole('timer'))), 'Crazy 8s timer counts down from eight minutes');
  await page.getByRole('textbox', {name: 'Prompt (a How might we question)'}).fill('How might we show one trusted date?');
  await page.getByRole('textbox', {name: 'Idea 1'}).fill('Verified badge');
  await page.getByRole('button', {name: 'Save round'}).click();
  await saw('Round saved.');
  check(true, 'Crazy 8s round saves');
  await go('/studio/ethics');
  await box('Risk').fill('Coach states an unsupported deadline');
  await page.getByRole('combobox', {name: 'Likelihood'}).selectOption('3');
  await page.getByRole('combobox', {name: 'Impact'}).selectOption('3');
  await page.getByRole('button', {name: 'Add risk'}).click();
  await page.locator('.riskGrid .cell.h', {hasText: 'Coach states an unsupported deadline'}).waitFor();
  check(true, 'High-likelihood, high-impact risk lands in the red band');
  await go('/reflect');
  check(await page.getByRole('button', {name: 'Save entry'}).isDisabled(), 'Reflection cannot be saved without a concept');
  await box('Concept or framework').fill('Extreme users');
  await page.getByRole('textbox', {name: 'The concept, in your own words'}).fill('Watching people at the edges shows needs that everyone has.');
  await page.getByRole('button', {name: 'Save entry'}).click();
  await saw('Entry saved.');
  check(await page.getByRole('button', {name: 'Download as Markdown'}).isEnabled(), 'Reflection entry saves and can be downloaded');
  await go('/course');
  await page.getByRole('button', {name: 'Load outline structure'}).click();
  await page.getByText('0/16 ready').waitFor();
  await page.getByRole('combobox', {name: 'Status for Use of a relevant framework'}).first().selectOption('ready');
  await page.getByText('1/16 ready').waitFor();
  await box('Name').fill('Krishna Mathur');
  await page.getByRole('button', {name: 'Add member'}).click();
  await saw('Member added.');
  await box('What they did').fill('Ran two interviews');
  await page.getByRole('button', {name: 'Log contribution'}).click();
  await saw('Contribution logged.');
  check(await page.locator('.matrix td.mono', {hasText: '1'}).count() >= 1, 'Course hub: rubric self-check and contribution matrix work');

  // ---------- Class prep, research ops, synthesis, report ----------
  await go('/learn');
  await page.getByRole('button', {name: 'Load the reading list'}).click();
  await page.getByText('0/18').waitFor();
  check(true, 'Reading list loads from the outline with 18 required readings');
  await box('Question').fill('What three parts make a Hill statement?');
  await box('Answer').fill('Who, what and a measurable wow');
  await page.getByRole('button', {name: 'Add card'}).click();
  await saw('Card added.');
  await page.getByRole('button', {name: 'Show answer'}).click();
  await page.getByRole('button', {name: 'I knew it'}).click();
  await page.getByText('Nothing due today').waitFor();
  check(true, 'Flashcard self-quiz moves a known card to a later day');
  await box('Session').fill('Session 3: Observe');
  await page.getByRole('button', {name: 'Log session'}).click();
  await saw('Session logged.');
  check(true, 'Participation log saves a session');
  await go('/studio/research');
  await box('Code').fill('P21');
  await page.getByRole('button', {name: 'Add participant'}).click();
  await saw('Participant added.');
  await page.getByRole('combobox', {name: 'Participant'}).selectOption('P21');
  await page.getByRole('button', {name: 'Start interview'}).click();
  await page.getByRole('radio', {name: 'Does'}).click();
  await page.getByRole('textbox', {name: 'What happened or was said'}).fill('Checked three apps before finding the quiz date');
  await page.keyboard.press('Enter');
  await page.getByRole('button', {name: 'Save interview'}).click();
  await saw('Interview saved.');
  await page.getByRole('button', {name: 'Turn into note and codes'}).click();
  await saw('Record consent');
  check(true, 'An interview cannot become research data before consent is recorded');
  await page.getByRole('combobox', {name: 'Consent for P21'}).selectOption('consented');
  await page.getByText('consent ' + new Date().toISOString().slice(0, 10)).waitFor();
  await page.getByRole('button', {name: 'Turn into note and codes'}).click();
  await saw('Converted to a note with codes');
  check(true, 'After consent, a captured interview becomes a note with coded moments');
  await go('/studio/synthesis');
  await page.locator('.affCard', {hasText: 'Checked three apps'}).first().waitFor();
  await page.getByRole('combobox', {name: /^Move Checked three apps/}).first().selectOption({label: 'Conflicting sources of truth'});
  await page.locator('.traceTree', {hasText: 'Checked three apps'}).waitFor();
  check(true, 'Synthesis board moves a code into a theme and the evidence trace updates');
  await go('/report');
  await page.getByRole('heading', {name: 'Research'}).waitFor();
  check((await text(page.locator('.report'))).includes('consented participants') && await page.getByRole('button', {name: 'Download Markdown'}).isEnabled(), 'Evidence report compiles the studio in rubric order');

  // ---------- Coordinator, deck, viva, calendar, account ----------
  await go('/coordinator');
  const template = await page.evaluate(async () => (await fetch('/course-template.json')).text());
  await page.getByRole('textbox', {name: 'Package JSON'}).fill(template.replace('Fictional demo course: Human-Centred Design Sprint', 'Imported smoke course'));
  await page.getByRole('button', {name: 'Check package'}).click();
  await page.getByText(/Replaces “/).waitFor();
  await page.getByRole('button', {name: 'Import and activate'}).click();
  await saw('Imported and activated');
  await page.getByText('Active now: Imported smoke course').waitFor();
  await page.getByRole('button', {name: 'Use the fictional demo course'}).click();
  await saw('Back to the fictional demo course');
  check(true, 'Coordinator imports, activates and reverts a course package');
  await page.getByRole('textbox', {name: 'Package JSON'}).fill('{"course": "x"}');
  await page.getByRole('button', {name: 'Check package'}).click();
  await page.getByText('Fix these before importing').waitFor();
  check(true, 'An invalid course package is rejected with reasons');
  await go('/deck');
  check(await page.locator('.slide').count() === 8, 'Slide deck renders a title, six stops and a closing slide');
  await go('/learn');
  await page.getByRole('textbox', {name: /^Your answer to: Which design thinking framework/}).fill('IDEO human-centred design, because it starts from observation.');
  await page.getByRole('button', {name: 'Make flashcard'}).first().click();
  await saw('Flashcard created from your answer.');
  check(true, 'Viva answers become flashcards');
  await go('/plan');
  check(await page.getByRole('button', {name: /Add plan and deadlines to my calendar/}).isEnabled(), 'Plan offers a calendar export');
  await go('/login');
  await page.getByText('No sign-in needed here').waitFor();
  await go('/privacy');
  await page.getByRole('heading', {name: 'Your controls'}).waitFor();
  await go('/settings');
  await page.getByRole('heading', {name: 'Account and data'}).waitFor();
  check(true, 'Single-user mode explains accounts; privacy and data controls are reachable');

  // ---------- Resizable panels ----------
  await go('/');
  const sideSep = page.getByRole('separator', {name: 'Resize sidebar'});
  const w0 = Number(await sideSep.getAttribute('aria-valuenow'));
  await sideSep.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  check(Number(await sideSep.getAttribute('aria-valuenow')) === w0 + 32, 'Sidebar resizes from the keyboard');
  const box0 = await sideSep.boundingBox();
  await page.mouse.move(box0.x + 5, box0.y + 200); await page.mouse.down(); await page.mouse.move(box0.x - 60, box0.y + 200, {steps: 5}); await page.mouse.up();
  check(Number(await sideSep.getAttribute('aria-valuenow')) < w0 + 32, 'Sidebar resizes by dragging');
  await sideSep.focus(); await page.keyboard.press('Enter');
  await page.getByRole('button', {name: 'Show menu'}).click();
  check(Number(await sideSep.getAttribute('aria-valuenow')) > 0, 'Sidebar collapses and restores');
  const panelSep = page.getByRole('separator', {name: 'Resize the road panel'});
  const p0 = Number(await panelSep.getAttribute('aria-valuenow'));
  await panelSep.focus(); await page.keyboard.press('ArrowLeft');
  check(Number(await panelSep.getAttribute('aria-valuenow')) === p0 + 16, 'Road panel widens from the keyboard');
  await page.reload(); await page.locator('.journey2').waitFor();
  check(Number(await page.getByRole('separator', {name: 'Resize the road panel'}).getAttribute('aria-valuenow')) === p0 + 16, 'Panel width persists after refresh');

  // ---------- Original journeys still work ----------
  await go('/imports');
  await page.getByRole('button', {name: 'Use sample CSV'}).click();
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByRole('region', {name: 'Validated preview'}).waitFor();
  check(true, 'Import preview still validates the sample CSV');
  await go('/review');
  await page.getByRole('textbox', {name: 'Review rationale'}).fill('Browser smoke test; synthetic source checked.');
  await page.getByRole('button', {name: 'Save review'}).click();
  await saw('Review saved');
  check(true, 'Review queue still saves a review');

  // ---------- Themes, navigation, layout ----------
  await go('/');
  await page.getByRole('combobox', {name: 'Appearance'}).selectOption('light');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  check(true, 'Light (dawn) theme survives refresh');
  await road.waitFor();
  await page.screenshot({path: 'output/playwright/journey-desktop-light.png'});
  await page.getByRole('combobox', {name: 'Appearance'}).selectOption('system');
  await page.emulateMedia({colorScheme: 'dark', reducedMotion: 'reduce'});
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  check(true, 'System theme follows the operating system');
  await page.getByRole('link', {name: 'Coach', exact: true}).click();
  await page.waitForURL(/\/coach$/);
  check(await page.getByRole('link', {name: 'Coach', exact: true}).getAttribute('aria-current') === 'page', 'Sidebar link navigates and marks the current page');
  await page.setViewportSize({width: 390, height: 844});
  await go('/');
  await page.getByRole('button', {name: 'Menu'}).click();
  await page.getByRole('link', {name: 'Story mode'}).click();
  await page.waitForURL(/\/story$/);
  check(true, 'Mobile menu opens and navigates');
  await go('/');
  await road.waitFor();
  await page.screenshot({path: 'output/playwright/journey-mobile-dark.png', fullPage: true});
  for (const route of ['/', '/plan', '/digest', '/coach', '/escalations', '/studio/observe', '/studio/empathy', '/studio/define', '/studio/envision', '/studio/ideate', '/studio/journeys', '/studio/prototypes', '/studio/experiments', '/studio/ethics', '/story', '/reflect', '/course', '/learn', '/studio/research', '/studio/synthesis', '/report', '/coordinator', '/deck', '/privacy']) {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({width, height: 900});
      await go(route); await settle();
      const wide = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 ? '' :
        [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.tableWrap,.journeyGrid,.affinity'))
          .slice(0, 3).map(e => e.tagName + '.' + e.className + ' right=' + Math.round(e.getBoundingClientRect().right)).join(' | ') || 'positioned element');
      check(!wide, `No page overflow on ${route} at ${width}px${wide ? ' (' + wide + ')' : ''}`);
    }
  }
  await page.setViewportSize({width: 1440, height: 1000});
  await page.emulateMedia({colorScheme: 'dark', reducedMotion: 'no-preference'});
  const hydration = consoleErrors.filter(e => /\bhydrat|unmount a root/i.test(e)); // \b skips the 3D label worker's 'rehydrate' notice
  check(hydration.length === 0, 'No hydration or root-unmount console errors: ' + hydration.slice(0, 3).join(' || ').slice(0, 600));
  return {kind: 'SYNTHETIC ENGINEERING VERIFICATION', ai_available: ai.available, count: checks.length, checks, other_console_errors: consoleErrors.slice(0, 10)};
}
