# Mercado automotivo

Static dashboard published by the existing GitHub → Cloudflare Pages integration.
`index.html` contains the reviewed snapshot, bundled runtime and authored application.
Monthly reviewed data remain in `data/`; ranking changes do not modify those files.

## Ranking views

Ranking has Lista, Conectado and Pirâmide, with shared entity/position/volume/search controls and global multi-select filters. Connected comparison reuses the existing coverage-aware A/B calculation worker, extended to brands, models and original model groups. The BD segment pyramid remains in Explorar.

`src/ranking-views.js` and `.css` maintain the new presentation. After edits run:

```sh
python scripts/build-ranking.py
node tests/ranking.test.cjs
```

The build script embeds those sources, checks both executable scripts, and updates exact inline-script CSP hashes in `_headers`. Other authored logic and the bundled workers remain inside `index.html`; do not overwrite it from an older snapshot.

Tests use the actual August/September 2026 cubes to verify totals, ranks, denominators, Mitsubishi identity, arbitrary Top N, filters, report generation, favorites validation and proportional pyramid geometry. No test fixtures are used as dashboard data.

Before publication also verify the preview in desktop/mobile and light/dark modes, including repeated subtab changes, custom A dates, favorites restoration, report dialogs and CSV exports.

## Overview and action footers

Overview uses the shared UF filter for persistent click/keyboard selection. The map
has a separately labeled national context (same other filters, excluding UF and
municipality), while indicators, charts, reports and exports use the selected
scope. Hover/focus only shows a transient tooltip. Clear selection removes UF and
municipality explicitly; the existing municipality/dealer exploration is retained.

`FooterAction` uses the bundled React DOM portal to place existing live action
components in a common footer, without copying their query state or handlers.
Ranking retains its existing footer. Contextual CSVs keep their own source rows
and scope; dialogs remain owned by their original components.

After edits to authored logic in `index.html`, refresh script hashes and run all
regressions:

```sh
python scripts/build-ranking.py
for test in tests/*.test.cjs; do node "$test" || exit; done
```

`overview-map.test.cjs` tests actual component handlers, `overview-data.test.cjs`
checks reviewed September source totals for BA/SP and the national baseline, and
`footer-actions.test.cjs` checks footer routing without replacing action handlers.
Browser QA must still check geometry, focus, light/dark/mobile, all tab footers,
report/export dialogs and municipality/dealer navigation on the deployed preview.

## Evolution analytics

`src/evolution-views.js`, `.css` and `evolution-market-worker.js` maintain the
three Evolution subviews and benchmark aggregations. After changing them run:

```sh
python scripts/build-evolution.py
for test in tests/*.test.cjs; do node "$test" || exit; done
```

See `EVOLUTION_SOURCE_AUDIT.md` for scope/denominators, coverage semantics,
retained detailed views and outstanding browser/publication checks.

## Seven areas and Cenários

The visible top navigation has Panorama, Evolução, Concorrência, Segmentos,
Territórios, Explorar and Cenários. Dados e metodologia is always a secondary
link. All legacy leaf URL IDs and favorite schemas remain registered. BD
structure charts moved intact to Segmentos; its existing pyramid is also
available there. Legacy Explore pyramid favorites still reopen as Segmentos.

`src/navigation.js/css` owns grouped navigation and the rounded outer glass
paint. Content overflow remains visible so menus and scroll regions are not cut.

Cenários has five subtabs backed by lazy-loaded `data/scenarios/*.json`.
The module explicitly labels its fixed national package and does not pretend
that global filters recompute it. Macro charts include official units, last
complete months, lag-specific reviewed residual pairs and exploratory warnings.
The municipal atlas supports real official state-local polygon extrusion,
per-1,000 or volume height, Mitsubishi-share color, rotation and a 2D alternative.
It is a state-by-state atlas, not a stitched national geographic mesh. GDP is
2023; population is 2026; municipal registers are January–September 2026.
The 30-city legacy sample remains separate and explicitly labeled.

Forecasts are experimental and disclose failure against held-out baselines and
actual test coverage of nominal intervals. A two-factor response surface is
unavailable because no such model has been validated. Existing frozen Phase 2
analyses, selectors and export handlers remain accessible in the expandable
“Análises anteriores e cenários congelados” section.

Build and test the combined application:

```sh
python scripts/build-scenarios.py
for test in tests/*.test.cjs; do node "$test" || exit; done
python -m unittest discover -s tests -p 'test_scenarios.py' -v
```

This builder embeds Cenários, then rebuilds Evolution and navigation, preserving
ranking sources and refreshing inline CSP hashes. See `SCENARIOS_DATA.md` for
source contracts and statistical limitations. To regenerate the data in this
checkout, use `python scripts/build_scenarios.py --repo .` after obtaining its
official external inputs. Source fetch scripts require internet and NumPy.

Before publication: real-browser desktop/mobile, light/dark, all five subtab
switches, 2D/3D rotation/UF changes, focus/hover tooltips, scatter/heatmap selection,
legacy expansion, CSV/report dialogs and back/forward require rendered QA.
Automated geometry/source tests are not a claim that browser QA has happened.
