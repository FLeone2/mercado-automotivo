# Evolution source and validation audit

## Scope and source

The three approved visual concepts are implemented in `src/evolution-views.js` and `.css`, with maintained worker source in `src/evolution-market-worker.js`. Images were inspected for layout and capabilities only. No preview numbers, curves or mock data enter dashboard results.

Every result comes from reviewed monthly cubes, using the existing source loader, population/dimension predicates, origin sidecar selection, cancellation, cache identity and coverage checks. There is no frozen historical snapshot substituted for unsupported filters. Missing BD/origin inputs continue to use existing worker errors; missing channel coverage and missing months remain unavailable, not zero.

The new benchmark's market removes only `marca`, `modelo` and `grupo_modelo` global selections, explicitly disclosed above the controls. All other filters remain applied, including geography, dates, population, propulsion, body and channel. Local brand checkboxes choose visible series, never the market denominator. The original detailed views retain all global filters.

## Arithmetic

- Monthly brand share: brand count / complete filtered benchmark market count.
- Mitsubishi identity: exact source brand `MITSUBISHI`.
- Mitsubishi/competitor: Mitsubishi volume / selected competitor volume; may exceed 100%; zero denominator is N/D.
- KPI volume and share: totals across selected period, never a single-month value presented as an aggregate.
- Percentage-point delta: `(current share - previous share) * 100`, explicitly labeled p.p.
- Propulsion: all actual classes including unclassified; independent full denominators in market and Mitsubishi panels. A manufacturer is never a propulsion category.
- Body presence: Mitsubishi body count / market count for the same body/month.
- Base 100: first selected month for each series; zero/missing first base remains unavailable.
- YoY: matching month in comparison range one year earlier, gated by existing comparable coverage and scope checks.
- Cumulative: selected months only, resetting each year; labels disclose that a range excluding January is not YTD. Missing observations invalidate subsequent cumulative values.

## Retained functionality

The original `HistoryView` is preserved as `LegacyHistoryView` in a disclosure: daily/monthly/annual overall trajectory, brands, models, bodies, fuel/technology, VD/varejo, monthly table and source-level action controls. No global navigation changes are included.

## Rebuild and checks

Run `python scripts/build-evolution.py`, followed by all `tests/*.test.cjs`. Builder embeds the maintained worker/views, then invokes shared ranking build for exact CSP hashes and syntax validation.

Tests verify real September 2026 BA counts against independently queried market and Mitsubishi scopes, real September 2025 comparison, source-derived composition totals, display-independent denominators, null comparisons, zero bases, cumulative gaps, p.p. arithmetic, render branches and repeated toggle state. All existing ranking/map/footer tests are retained.

Browser visual/interactivity QA, mobile/dark-mode screenshots, publication, remote commit verification and deployment CI are NOT completed by this change. They remain required before reporting deployed completion.
