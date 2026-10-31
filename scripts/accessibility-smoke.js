// Automated axe scan of every screen in light and dark at desktop and 320px.
// Install axe-core anywhere (npm install --prefix <dir> axe-core@4), then run with the path substituted:
//   npx --yes --package @playwright/cli playwright-cli --session resumeloop run-code "$(sed "s#AXE_PATH#<dir>/node_modules/axe-core/axe.min.js#" scripts/accessibility-smoke.js)"
// Automated checks find some barriers only; this is not WCAG certification.
async (page) => {
  const BASE = 'http://127.0.0.1:3000';
  const ROUTES = ['/', '/plan', '/digest', '/coach', '/escalations', '/studio/observe', '/studio/empathy', '/studio/define', '/studio/envision', '/studio/ideate', '/studio/journeys', '/studio/prototypes', '/studio/experiments', '/studio/ethics', '/story', '/reflect', '/course', '/learn', '/studio/research', '/studio/synthesis', '/report', '/imports', '/review', '/settings'];
  const results = [];
  for (const mode of ['light', 'dark']) {
    await page.emulateMedia({colorScheme: mode, reducedMotion: 'reduce'});
    for (const width of [1440, 320]) {
      await page.setViewportSize({width, height: 1000});
      for (const route of ROUTES) {
        await page.goto(BASE + route);
        await page.locator('.hero, .journey2').first().waitFor({timeout: 30000});
        await page.evaluate(() => { try { localStorage.setItem('ResumeLoop-theme', 'system'); } catch { /* ignore */ } });
        await page.waitForFunction(m => document.documentElement.dataset.theme === m, mode);
        await page.evaluate(async () => { await Promise.all(document.getAnimations().map(a => a.finished.catch(() => null))); await new Promise(r => setTimeout(r, 300)); });
        await page.addScriptTag({path: 'AXE_PATH'});
        const r = await page.evaluate(async () => {
          const run = await window.axe.run(document.querySelector('.appShell'), {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']}});
          return {violations: run.violations.map(v => ({id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 4).map(n => ({target: n.target, summary: n.failureSummary}))})),
            incomplete: run.incomplete.map(v => v.id), passes: run.passes.length};
        });
        results.push({mode, width, route, ...r});
      }
    }
  }
  await page.emulateMedia({colorScheme: 'dark', reducedMotion: 'no-preference'});
  await page.setViewportSize({width: 1440, height: 1000});
  const failing = results.filter(r => r.violations.length);
  return {kind: 'AUTOMATED ACCESSIBILITY CHECK; NOT WCAG CERTIFICATION', scans: results.length, scans_with_violations: failing.length,
    violation_ids: [...new Set(failing.flatMap(r => r.violations.map(v => v.id)))],
    needs_manual_review: [...new Set(results.flatMap(r => r.incomplete))].sort(), failing};
}
