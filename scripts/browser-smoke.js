// Run with both local services up and a throwaway DEMO_DB_PATH (see PROGRESS.md):
//   npx --yes --package @playwright/cli playwright-cli --session resumeloop open http://127.0.0.1:3000
//   npx --yes --package @playwright/cli playwright-cli --session resumeloop run-code "$(cat scripts/browser-smoke.js)"
// Synthetic engineering verification only; not participant usability evidence.
async (page) => {
  const BASE = 'http://127.0.0.1:3000';
  const API = 'http://127.0.0.1:8014';
  const AI = 150000;
  const checks = [];
  const check = (condition, label) => { if (!condition) throw Error('FAILED: ' + label); checks.push(label); };
  const go = async path => { await page.goto(BASE + path); await page.locator('.hero, .journey').first().waitFor({timeout: 30000}); };
  const settle = () => page.evaluate(async () => { await Promise.all(document.getAnimations().map(a => a.finished)); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
  const text = loc => loc.innerText();
  const toast = page.locator('.toast');
  await page.addInitScript(() => { window.confirm = () => true; });
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.setViewportSize({width: 1440, height: 1000});
  await page.request.delete(API + '/api/learner/progress');
  const ai = await (await page.request.get(API + '/api/ai/status')).json();

  // ---------- Journey: 3D road + accessible list ----------
  await go('/');
  await page.locator('.roadStage canvas').waitFor({timeout: 30000});
  check(true, '3D canvas renders on the journey');
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
  await page.getByRole('button', {name: 'Mark complete'}).click();
  await page.getByRole('status').filter({hasText: 'Saved'}).waitFor();
  await page.reload(); await page.locator('.journey').waitFor();
  await stars.first().waitFor();
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
  await page.keyboard.press('Tab');
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
  await toast.filter({hasText: 'Queued locally. Nothing was sent anywhere.'}).waitFor();
  check(true, 'Approved message is queued locally and never sent');
  await page.getByRole('checkbox', {name: /Coordinator view/}).check();
  await page.getByRole('textbox', {name: 'Answer'}).first().fill('Fictional answer: use 26 November.');
  await page.getByRole('button', {name: 'Record answer'}).first().click();
  await toast.filter({hasText: 'Answer recorded.'}).waitFor();
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
  await toast.filter({hasText: 'Remove emails and phone numbers'}).waitFor();
  check(true, 'Privacy guard rejects a note with a phone number');
  await page.getByRole('textbox', {name: 'Anonymised note'}).fill('Smoke test note: I checked three places and none agreed on the date.');
  await page.getByRole('button', {name: 'Save note'}).click();
  await toast.filter({hasText: 'Note saved.'}).waitFor();
  check(true, 'A consented, anonymised note saves');
  await page.getByText('Add a code by hand').click();
  await page.getByRole('textbox', {name: 'Label'}).fill('Invented');
  await page.getByRole('textbox', {name: 'Exact quote from the note'}).fill('this sentence is not in the note');
  await page.getByRole('button', {name: 'Add code'}).click();
  await toast.filter({hasText: 'copied exactly'}).waitFor();
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
  await toast.filter({hasText: 'Theme created.'}).waitFor();
  check(true, 'A theme is created from the empathy map');
  await page.screenshot({path: 'output/playwright/empathy-desktop.png', fullPage: true});

  // ---------- Ideate ----------
  await go('/studio/ideate');
  await page.getByRole('textbox', {name: 'Your name for votes and scores'}).fill('Smoke tester');
  const hmwBox = page.getByRole('textbox', {name: 'New How might we question'}).first();
  await hmwBox.fill('Why do dates change so often?');
  await hmwBox.locator('xpath=..').getByRole('button', {name: 'Add'}).click();
  await toast.filter({hasText: 'How might we'}).waitFor();
  check(true, 'A question that does not start with How might we is rejected');
  await hmwBox.fill('How might we show one trusted date?');
  await hmwBox.locator('xpath=..').getByRole('button', {name: 'Add'}).click();
  await toast.filter({hasText: 'Question added.'}).waitFor();
  await page.getByRole('textbox', {name: 'New idea'}).first().fill('Verified-date badge');
  await page.getByRole('button', {name: 'Add idea'}).first().click();
  await toast.filter({hasText: 'Idea added.'}).waitFor();
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
  await toast.filter({hasText: 'Session saved.'}).waitFor();
  check((await text(page.locator('section[aria-labelledby="res"]'))).includes('1 session(s)'), 'Results summarise the recorded session');

  // ---------- Ethics ----------
  await go('/studio/ethics');
  await page.getByRole('heading', {name: 'AI decision log'}).waitFor();
  check(await page.locator('section', {has: page.getByRole('heading', {name: 'AI decision log'})}).locator('tbody tr').count() >= 1, 'Ethics panel shows logged AI calls');

  // ---------- Story mode ----------
  await go('/story');
  const card = page.locator('.storyCard h2');
  await card.filter({hasText: 'Empathise'}).waitFor();
  await page.locator('body').click({position: {x: 5, y: 300}});
  await page.keyboard.press('ArrowRight');
  await card.filter({hasText: 'Define'}).waitFor();
  await page.getByRole('button', {name: 'Go to Impact · SDG 4'}).click();
  await card.filter({hasText: 'Impact'}).waitFor();
  check((await text(page.locator('.storyCard'))).includes('fictional') || (await text(page.locator('.storyCard'))).includes('hypothesis'), 'Story mode moves by keyboard and buttons and stays honest about evidence');
  await page.screenshot({path: 'output/playwright/story-desktop.png'});

  // ---------- Original journeys still work ----------
  await go('/imports');
  await page.getByRole('button', {name: 'Use sample CSV'}).click();
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByRole('region', {name: 'Validated preview'}).waitFor();
  check(true, 'Import preview still validates the sample CSV');
  await go('/review');
  await page.getByRole('textbox', {name: 'Review rationale'}).fill('Browser smoke test; synthetic source checked.');
  await page.getByRole('button', {name: 'Save review'}).click();
  await toast.filter({hasText: 'Review saved'}).waitFor();
  check(true, 'Review queue still saves a review');

  // ---------- Themes, navigation, layout ----------
  await go('/');
  await page.getByRole('combobox', {name: 'Appearance'}).selectOption('light');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  check(true, 'Light (dawn) theme survives refresh');
  await page.locator('.roadStage canvas').waitFor();
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
  await page.locator('.roadStage canvas').waitFor();
  await page.screenshot({path: 'output/playwright/journey-mobile-dark.png', fullPage: true});
  for (const route of ['/', '/plan', '/digest', '/coach', '/escalations', '/studio/empathy', '/studio/ideate', '/studio/experiments', '/studio/ethics', '/story']) {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({width, height: 900});
      await go(route); await settle();
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `No page overflow on ${route} at ${width}px`);
    }
  }
  await page.setViewportSize({width: 1440, height: 1000});
  await page.emulateMedia({colorScheme: 'dark', reducedMotion: 'no-preference'});
  const hydration = consoleErrors.filter(e => /hydrat|unmount a root/i.test(e));
  check(hydration.length === 0, 'No hydration or root-unmount console errors');
  return {kind: 'SYNTHETIC ENGINEERING VERIFICATION', ai_available: ai.available, count: checks.length, checks, other_console_errors: consoleErrors.slice(0, 10)};
}
