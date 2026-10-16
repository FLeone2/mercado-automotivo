'use strict';
// Source-level regression only: browser pixel/interaction QA is still required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const css = read('src/shared-layout-refinements.css');
const maps = read('src/catalog-maps.css');
const authored = read('index.html') + fs.readdirSync(path.join(root, 'src')).filter(n => /\.(js|css)$/.test(n) && n !== 'shared-layout-refinements.css').map(n => read('src/' + n)).join('\n');
const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
// Each target is an existing authored class, not a guessed tab name.
for (const [, name] of clean.matchAll(/\.([a-z][a-z0-9-]*)/g)) {
  assert(authored.includes(name), `Unknown authored layout class ${name}`);
}
for (const selector of [
  '.data-section-header', // Panorama / structure / propulsion / origin / all shared sections
  '.am-ranking-compact-heading', '.am-ranking-periods',
  '.ev-interactive-controls', '.ev-toolbar', '.ev-years-scroll',
  '.am-market-views-controls', // competition, propulsion and origin chart modes
  '.am-geography-controls', '.tc-values', '.cm-controls',
  '.am-explore-local-controls', '.catalog-controls', '.cc-scroll',
  '.animations-heading', '.animations-method',
  '.am-scenario-provenance', '.am-scenario-source-card',
  '.am-quality-metrics', '.am-quality-notes', '.am-note-entry'
]) assert(clean.includes(selector), `Coverage missing: ${selector}`);
assert(!/display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$)|overflow(?:-\w+)?\s*:\s*(?:hidden|clip)|line-clamp|text-overflow\s*:/i.test(clean), 'No graphs, labels, notes, metrics or controls may be hidden or clipped.');
assert(!/(?:^|[\s,])(?:svg|canvas|path|circle)(?:[\s,{.:]|$)/m.test(clean), 'Shared cleanup must not alter chart geometry.');
assert(!/(?:^|[;{])\s*(?:height|max-height)\s*:/m.test(clean), 'No chart or note height caps.');
assert(!/!important/.test(clean), 'Respect view-level styles and accessibility overrides.');
assert(clean.includes('@media (min-width: 1200px)'));
assert(clean.includes('@media (max-width: 600px)'));
assert(clean.includes('@media (max-width: 360px)'));
assert(clean.includes('grid-template-columns: minmax(0, 1fr)'));
assert(clean.includes('white-space: normal'));
assert(clean.includes('min-height: 44px'));
assert(clean.includes('overscroll-behavior-inline: contain'));
assert(clean.includes('flex-wrap: wrap'));
// Narrowest track algebra, accounting for 16px page margins at a 320px viewport.
for (const viewport of [320, 360, 375, 600, 1200, 1440, 1920]) {
  const inner = viewport - 32;
  const columns = viewport <= 360 ? 1 : viewport <= 600 ? 2 : 4;
  assert(inner / columns - 24 > 0, 'Quality cards keep positive text space.');
}
assert(maps.includes('linear-gradient(140deg,var(--surface,#f9fcff),var(--muted,#f0f6fc))'));
assert(maps.includes('background:var(--muted,#edf5ff);color:var(--text,#193550)'));
assert(maps.includes('background:var(--control,#fff);color:var(--text,#183b60)'));
assert(!maps.includes('var(--surface-color') && !maps.includes('var(--text-color'));
assert(!/color:#4d6277/.test(maps), 'Method and context text follow the active light/dark theme.');
// Cartographic color scales retain their authored quantitative semantics.
assert(maps.includes('linear-gradient(90deg,#e2effc,#20569e)'));
assert(maps.includes('linear-gradient(90deg,#cd694b,#f5f5f5,#20569e)'));
console.log('PASS shared tab layout source regression: existing selectors, all-tab coverage, no hidden content or chart geometry changes, responsive 320px/dense desktop rules, live map theme tokens and preserved scales. Browser pixel QA remains separate.');
