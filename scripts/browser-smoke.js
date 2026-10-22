// Run via playwright-cli run-code "$(cat scripts/browser-smoke.js)" on the local app.
// Synthetic engineering verification only; not participant usability evidence.
async (page) => {
  const checks = [];
  const check = (condition, label) => {if (!condition) throw Error(label); checks.push(label);};
  const importNav = () => page.getByRole('button', {name: 'Imports', exact: true});
  await page.setViewportSize({width: 1440, height: 1050});
  await importNav().click();
  await page.getByRole('button', {name: 'Use sample CSV'}).click();
  const editor = page.getByRole('textbox', {name: 'Synthetic CSV'});
  const sample = await editor.inputValue();
  await editor.fill(sample.trimEnd() + ',extra\n');
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByText('Row 2 · row: Expected 7 cells; found 8.').waitFor();
  check(await page.getByText('Nothing saved. Fix the indicated rows.').isVisible(), 'Extra CSV cell rejected with row reference');
  await page.screenshot({path: 'output/playwright/import-error-desktop.png', fullPage: true});
  await editor.fill(sample);
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByRole('region', {name: 'Validated preview'}).waitFor();
  check(await page.getByRole('button', {name: 'Save synthetic import'}).isEnabled(), 'Preview enables explicit save');
  await editor.fill(sample + '\n');
  check(await page.getByRole('button', {name: 'Save synthetic import'}).count() === 0, 'Editing invalidates preview');
  await editor.fill(sample);
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByRole('button', {name: 'Save synthetic import'}).click();
  await page.getByRole('region', {name: 'Saved import receipt'}).waitFor();
  const savedId = await page.getByRole('region', {name: 'Saved import receipt'}).locator('dd').first().innerText();
  check(await page.getByRole('region', {name: 'Saved import receipt'}).getByText('1 created · 0 updated · 0 review statuses preserved').isVisible(), 'Saved outcome has reconciled row totals');
  await page.screenshot({path: 'output/playwright/import-saved-desktop.png', fullPage: true});
  await page.reload();
  await importNav().click();
  await page.getByText('Draft restored on this device. Preview it again before saving.').waitFor();
  check(await editor.inputValue() === sample, 'Draft survives refresh');
  await page.getByRole('button', {name: 'Open receipt ' + savedId, exact: true}).click();
  await page.getByRole('heading', {name: 'Source snapshot at import'}).waitFor();
  check(await page.getByRole('region', {name: 'Saved import receipt'}).getByText('D-CUSTOM-001').isVisible(), 'Receipt and source snapshot survive refresh');
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByRole('button', {name: 'Save synthetic import'}).click();
  await page.getByText('Already saved. The original receipt was recovered; no records changed.').waitFor();
  checks.push('Exact retry returns original receipt');

  // A response lost AFTER the server commits must still be recoverable safely.
  const lostInput = sample.replace('D-CUSTOM-001', 'D-BROWSER-LOST-' + Date.now());
  await editor.fill(lostInput);
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByRole('region', {name: 'Validated preview'}).waitFor();
  await page.route('**/api/demo/import', async route => {await route.fetch(); await route.abort();}, {times: 1});
  await page.getByRole('button', {name: 'Save synthetic import'}).click();
  await page.getByText(/The save could not be confirmed/).waitFor();
  await page.getByRole('button', {name: 'Save synthetic import'}).click();
  await page.getByText('Already saved. The original receipt was recovered; no records changed.').waitFor();
  checks.push('Lost save response recovered by identical retry');

  await editor.fill(sample);
  await page.route('**/api/demo/import/preview', route => route.abort());
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByText(/Could not reach the local API/).waitFor();
  check(await editor.inputValue() === sample, 'Network failure preserves draft');
  await page.unroute('**/api/demo/import/preview');
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByRole('region', {name: 'Validated preview'}).waitFor();
  checks.push('Preview retry succeeds after network recovery');

  await page.getByRole('combobox', {name: 'Appearance'}).selectOption('dark');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  checks.push('Dark theme survives refresh');
  await importNav().click();
  await page.setViewportSize({width: 390, height: 844});
  await page.screenshot({path: 'output/playwright/import-mobile-dark.png', fullPage: true});
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.evaluate(async () => {await Promise.all(document.getAnimations().map(a => a.finished)); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));});
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page overflow at ' + width + 'px');
  }
  await page.getByRole('combobox', {name: 'Appearance'}).selectOption('system');
  await page.emulateMedia({colorScheme: 'light', reducedMotion: 'reduce'});
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await page.emulateMedia({colorScheme: 'dark'});
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  checks.push('System theme responds to media changes');
  await page.getByRole('combobox', {name: 'Appearance'}).selectOption('light');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await editor.focus();
  await page.keyboard.press('Tab');
  check(await page.getByRole('button', {name: 'Preview & validate'}).evaluate(el => el === document.activeElement), 'Keyboard reaches preview from editor');
  check(await page.getByRole('button', {name: 'Preview & validate'}).evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), 'Keyboard focus ring visible');
  await page.keyboard.press('Enter');
  await page.getByRole('region', {name: 'Validated preview'}).waitFor();
  check(await page.getByRole('region', {name: 'Validated preview'}).evaluate(el => el === document.activeElement), 'Keyboard focus moves to validation result');
  await page.getByRole('button', {name: 'Recovery plans', exact: true}).click();
  await page.waitForFunction(() => {const image = document.querySelector('.futurePanel img'); return image && image.complete && image.naturalWidth > 0;});
  await page.screenshot({path: 'output/playwright/recovery-empty-desktop.png', fullPage: true});
  checks.push('Generated illustration loads on honest planned-state view');

  await page.getByRole('button', {name: 'Overview', exact: true}).click();
  await page.getByRole('textbox', {name: 'Search cases'}).fill('D-CUSTOM-001');
  await page.getByRole('button', {name: 'Review the recap D-CUSTOM-001'}).click();
  await page.getByRole('textbox', {name: 'Review rationale'}).fill('Browser smoke test; synthetic source checked.');
  await page.getByRole('button', {name: 'Save review', exact: true}).click();
  await page.getByText('Review saved to local demonstration database.').waitFor();
  await page.reload();
  await page.getByRole('textbox', {name: 'Search cases'}).fill('D-CUSTOM-001');
  await page.getByRole('button', {name: 'Review the recap D-CUSTOM-001'}).click();
  check(await page.getByRole('complementary', {name: 'Record inspector'}).locator('.meta strong').innerText() === 'approved', 'Existing review journey persists after refresh');
  await page.getByRole('textbox', {name: 'Search cases'}).fill('absent fixture');
  await page.getByText('No demo cases match this filter. Try clearing the search.').waitFor();
  checks.push('Queue empty state works');
  await importNav().click();
  await page.getByRole('button', {name: 'Clear draft'}).click();
  await page.reload();
  await importNav().click();
  check(await editor.inputValue() === '', 'Clear draft persists');
  return {kind: 'SYNTHETIC ENGINEERING VERIFICATION', checks};
}
