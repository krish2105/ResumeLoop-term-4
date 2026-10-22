// Run after browser-smoke via playwright-cli; install axe-core under /tmp/resumeloop-browser-tools.
async (page) => {
  const results = [];
  await page.getByRole('button', {name: 'Imports', exact: true}).click();
  await page.getByRole('button', {name: 'Use sample CSV'}).click();
  await page.getByRole('button', {name: 'Preview & validate'}).click();
  await page.getByRole('region', {name: 'Validated preview'}).waitFor();
  await page.addScriptTag({path: '/tmp/resumeloop-browser-tools/node_modules/axe-core/axe.min.js'});
  for (const mode of ['light', 'dark']) {
    await page.getByRole('combobox', {name: 'Appearance'}).selectOption(mode);
    await page.waitForFunction(mode => document.documentElement.dataset.theme === mode, mode);
    for (const width of [1440, 320]) {
      await page.setViewportSize({width, height: 1000});
      await page.evaluate(async () => {await Promise.all(document.getAnimations().map(a => a.finished)); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));});
      const result = await page.evaluate(async () => {
        const run = await window.axe.run(document.querySelector('.shell'), {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']}});
        return {violations: run.violations.map(v => ({id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({target: n.target, summary: n.failureSummary}))})), incomplete: run.incomplete.map(v => ({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})), passes: run.passes.length};
      });
      results.push({mode, width, ...result});
    }
  }
  await page.setViewportSize({width: 1440, height: 1050});
  await page.getByRole('combobox', {name: 'Appearance'}).selectOption('light');
  return {kind: 'AUTOMATED ACCESSIBILITY CHECK; NOT WCAG CERTIFICATION', results};
}
