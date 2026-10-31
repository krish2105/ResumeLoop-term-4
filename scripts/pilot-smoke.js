// Browser pilot, end to end, against the public-demo build (NEXT_PUBLIC_DEMO_MODE=1) on port 3001:
//   npx --yes --package @playwright/cli playwright-cli --session pilot open http://127.0.0.1:3001
//   npx --yes --package @playwright/cli playwright-cli --session pilot run-code "$(cat scripts/pilot-smoke.js)"
// Uses the fictional course template renamed as a pilot course. Synthetic engineering verification only.
async (page) => {
  const BASE = 'http://127.0.0.1:3001';
  const checks = [];
  const check = (condition, label) => { if (!condition) throw Error('FAILED: ' + label); checks.push(label); };
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => {
    window.confirm = () => true;
    const original = URL.createObjectURL;  // keep the last downloaded file so the test can read it
    URL.createObjectURL = blob => { window.__lastBlob = blob; return original.call(URL, blob); };
  });
  const file = (name, value) => ({name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value))});
  const template = await (await page.request.get(BASE + '/course-template.json')).json();
  const course = {...template, course: 'Pilot check course (synthetic)', source_owner: 'ResumeLoop test coordinator'};

  await page.setViewportSize({width: 1280, height: 900});
  await page.goto(BASE + '/settings');
  await page.evaluate(() => localStorage.clear());

  // ---------- Coordinator loads the course file ----------
  await page.goto(BASE + '/coordinator');
  await page.getByRole('heading', {name: 'Start a browser pilot'}).waitFor();
  const broken = JSON.parse(JSON.stringify(course));
  broken.versions[0].actions[0].prerequisites = [broken.versions[0].actions[1].id];
  broken.versions[0].actions[1].source_ref = 'S42';
  await page.getByLabel('Course file').setInputFiles(file('broken.json', broken));
  const alert = page.getByRole('alert').filter({hasText: 'cannot be used yet'});
  await alert.waitFor();
  const alertText = await alert.innerText();
  check(/cycle/.test(alertText) && /unknown sources S42/.test(alertText), 'A course file with a prerequisite cycle and an unknown source is refused with reasons');
  await page.getByLabel('Course file').setInputFiles(file('course.json', course));
  await page.getByText('Fingerprint').waitFor();
  const load = page.getByRole('button', {name: 'Load this course'});
  check(await load.isDisabled(), 'Loading needs the coordinator to confirm permission to share');
  await page.getByLabel(/I have permission from ResumeLoop test coordinator/).check();
  await load.click();
  await page.getByRole('heading', {name: 'Pilot course in this browser'}).waitFor();
  const fp = (await page.locator('.meta.mono').first().innerText()).match(/Fingerprint (\w+)/)[1];
  check(fp.length === 12, 'The loaded course shows its fingerprint');
  check((await page.locator('.sideFoot').innerText()).includes('Browser pilot'), 'The sidebar says a browser pilot is active');

  // ---------- Learner plans, reads the digest and asks the coach ----------
  await page.goto(BASE + '/');
  const help = page.locator('#budget-help');
  await help.filter({hasText: 'tasks lit'}).waitFor();
  check((await page.locator('.hud').innerText()).startsWith('0/'), 'Pilot progress starts empty, apart from the fictional demo progress');
  const put = page.getByRole('status').filter({hasText: 'Saved'});
  await page.getByRole('button', {name: 'Mark complete'}).click();
  await put.waitFor();
  await page.reload(); await help.filter({hasText: 'tasks lit'}).waitFor();
  check((await page.locator('.hud').innerText()).startsWith('1/'), 'A completed pilot task persists after refresh');
  check((await page.locator('.detailCard').innerText()).includes('pilot course'), 'The task card names the pilot course');
  await page.goto(BASE + '/digest');
  await page.getByText(/7 changes between v1 and v2, computed from the course versions/).waitFor();
  check(true, 'The digest is computed from the pilot course versions');
  await page.goto(BASE + '/coach');
  await page.getByText('Browser pilot · no AI, closest passage').waitFor();
  await page.getByLabel('Your question').fill('When is the reading check quiz due?');
  await page.getByRole('button', {name: /^Ask/}).click();
  await page.getByText(/no AI in the browser pilot, so here are the closest course passages\..*\[S3-p2\]/).waitFor();
  check(true, 'The coach answers with the closest cited passage and says there is no AI');
  await page.getByLabel('Your question').fill('What is the parking fee at the zoo?');
  await page.getByRole('button', {name: /^Ask/}).click();
  await page.getByText(/won't guess/).last().waitFor();
  check(true, 'The coach declines questions the course does not cover');

  // ---------- Learner shares progress ----------
  await page.goto(BASE + '/settings');
  await page.getByRole('heading', {name: 'Share your progress with the coordinator'}).waitFor();
  await page.getByLabel('Learner code from your coordinator').fill('Priya S');
  check(await page.getByRole('button', {name: 'Download progress file'}).isDisabled(), 'A name with a space is refused as a learner code');
  await page.getByLabel('Learner code from your coordinator').fill('L01');
  await page.getByRole('button', {name: 'Download progress file'}).click();
  await page.getByText('Downloaded resumeloop-progress-L01.json').waitFor();
  const shared = JSON.parse(await page.evaluate(() => window.__lastBlob.text()));
  check(shared.learner_code === 'L01' && shared.completed.length === 1 && !('notes' in shared) && shared.course_sha256.startsWith(fp), 'The progress file holds the code, completed tasks and fingerprint, and no notes');

  // ---------- Coordinator combines files ----------
  await page.goto(BASE + '/coordinator');
  const other = {...shared, learner_code: 'L02', completed: [], seen_version: 'v2'};
  const wrong = {...shared, learner_code: 'L03', course_sha256: '0'.repeat(64)};
  await page.getByLabel('Progress files').setInputFiles([file('l01.json', shared), file('l02.json', other), file('l03.json', wrong)]);
  await page.getByRole('heading', {name: 'Pilot learners (2)'}).waitFor();
  const table = await page.getByRole('region', {name: 'Pilot learner progress'}).innerText();
  check(/L01\s+1\/\d+\s+not yet/.test(table) && /L02\s+0\/\d+\s+yes/.test(table), 'The roll-up shows each learner, tasks done and whether they saw the latest version');
  check((await page.getByRole('alert').filter({hasText: 'Some files were not added'}).innerText()).includes('l03.json: made for a different course file'), 'A progress file for a different course file is refused');
  await page.getByRole('button', {name: 'Download summary (CSV)'}).click();
  const summary = await page.evaluate(() => window.__lastBlob.text());
  check(summary.startsWith('learner_code,completed,of') && summary.includes('L02,0,'), 'The summary downloads as CSV');

  // ---------- Leave the pilot ----------
  await page.getByRole('button', {name: 'Leave the pilot'}).click();
  await page.getByRole('heading', {name: 'Start a browser pilot'}).waitFor();
  await page.goto(BASE + '/');
  await help.filter({hasText: 'tasks lit'}).waitFor();
  check(!(await page.locator('.sideFoot').innerText()).includes('Browser pilot'), 'Leaving the pilot brings back the fictional demo course');

  // ---------- Phone width ----------
  await page.setViewportSize({width: 320, height: 800});
  for (const r of ['/coordinator', '/settings']) {
    await page.goto(BASE + r); await page.locator('.hero').first().waitFor();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No page overflow on ${r} at 320px`);
  }
  const hydration = errors.filter(e => /\bhydrat|unmount a root/i.test(e));
  check(hydration.length === 0, 'No hydration errors');
  return {kind: 'SYNTHETIC ENGINEERING VERIFICATION', count: checks.length, checks, other_console_errors: errors.slice(0, 5)};
}
