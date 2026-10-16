# Animation data contract and verification

## Implementation

- `src/animations-data.js`: standalone pure API exported as both `AnimationData` and `AnimationsData`, plus CommonJS for tests.
- `src/animations-worker.js`: bounded lazy monthly-cube loader, request runner, cancellation and result cache. The build concatenates the data module followed by the worker source inside its Blob. It does not execute or modify the shared market worker.
- The loader accepts same-origin HTTP(S) resources, rejects credential-bearing URLs, decodes gzip, validates monthly dates/dictionaries/integer weights, and retains at most 5,000,000 decoded cells and 16 MiB compressed data. Retained result cache is capped at 24 MiB/four entries using a bounded conservative object-graph estimate. It stops at the budget without serializing or encoding the full response and counts shared aliases only once. These are retained-data budgets, not a bound on transient JavaScript heap.

## Request and response

Request fields: `id`, `type:'animations'`, `manifest`, `base`, `filters`, `startMonth`, `endMonth`, `preset`, `porte`, `selectedUF`, `mode`, `dimension`, `includeYoY`, `originMapping`. `start`/`end`/`uf` are accepted aliases. Modes are `monthly` and `ytd`. `includeVehicleOrigin` defaults to true; when available the reviewed origin-extended monthly cube preserves the other source dimensions.

All global dimensions and population are preserved. The requested animation window replaces only the global date filter with complete calendar months; `windowDisclosure`, `originalDate`, and `replacedFilters:['date']` expose that change explicitly. Preset restrictions intersect existing filters instead of overriding them.

The result contains `frames`, `monthlyFrames`, `coverage`, `complete`, `filters`, `range`, `selectedUF`, `municipalityRequested`, `notes`, `choices`, `sourceErrors`, and `presetValidation`.

Each frame includes:

- `month`, `date`, `mode`, `frequency:'monthly'`, `complete`, `coverageStatus`, `total`, `observedTotal`
- `groups` for marca, modelo, grupo_modelo, uf, propulsao, bd_combustivel, bd_carroceria, bd_segmento, tipo_venda, and bd_origem
- `entities` as the requested dimension's group; `mixes` aliases for technology/body/porte/origin/channel/vehicleOrigin
- `brandMembership` with exact source brands and their weighted counts
- `ufRows`, `municipalityRows`, `originRows`, `channelCoverage`
- `selectedUF`, `municipalityRequested`, `technologyAvailable`, and `vehicleOriginAvailable` when a cube was read

Rows have `name`, `count`, `observedCount`, `share`, `marketShare`, `brands:{brand:count}`, `isMIT`, `mitCount`, `mitShare`, `technologyCounts`, `observedTechnologyCounts`, `electrifiedCount`, `electrifiedShare`, and `unclassifiedCount`. When YoY is requested they also have `priorCount`, `priorShare`, `yoy`, and `yoyStatus`.

UF rows include `uf`. Municipality rows include `municipality`, `uf`, `ibgeCode`, and `geographicMatch`. Official IDs are assigned only by a unique normalized source-name/UF match against the bundled official geometry. Source rows with no unique match remain present with a null ID.

## Analytical safeguards

- Picapes médias uses the source label `bd_segmento = PICK-UP MID` exactly. No compact, small, large, generic pickup, or name-inferred category is admitted.
- SUV uses `bd_carroceria = SUV` exactly, with an optional intersecting porte selection.
- Counts are summed source weights, not row counts. All shares use the full filtered denominator before display Top N.
- Missing and unavailable months have null totals. Partial months preserve observed counts but suppress valid totals/shares. No carrying forward or inferred zero replaces a missing month.
- YTD restarts in January, loads January context when needed, and suppresses totals if any January-through-current month is missing/incomplete or the source population scope changes.
- YoY needs complete matching periods and the same source population scope. Missing or zero prior denominators produce null growth, never infinity. A valid disappearance from a positive prior base can produce −100%.
- Ranking ties are deterministic by name. Pinned Mitsubishi members retain their actual market rank and do not alter Top N denominators. Mitsubishi identification uses exact observed brand membership, never a substring in a model name.
- Fixed bubble domains use all comparable points in the chosen window. Radius is proportional to the square root of volume. Iterative extrema avoid the JavaScript argument-count limit on long histories.
- Brand origin uses the supplied source-linked brand mapping and its applicable years. A supplied non-verified mapping status is rejected. China, other verified origins, Brazilian–Chinese partnership, and unknown remain separate. Brand origin is never inferred from vehicle assembly/import origin (`bd_origem`) or a nationality code.
- Combined electrification is explicitly BEV + PHEV + HEV + MHEV. Individual technology counts remain separate; unknown technology is retained. FCEL is not silently added to that definition.
- Unavailable historic sales channels remain unknown. Filtering for VD/VAREJO in a month whose channel field was absent yields unavailable data rather than a false observed zero.
- Replaced, canceled, or cache-cleared requests cannot publish stale terminal responses, even if a transport ignores abort.

## Verification performed

Commands:

- `node --test tests/animations-data.test.cjs tests/animations-worker.test.cjs`
- `node tests/animations-real-source.test.cjs`

Results: all 23 focused data/worker tests passed, including a 220,000-point bubble-domain regression. Real reviewed monthly cubes and the existing 96-brand verified mapping reconcile as follows:

| Check | Verified count |
|---|---:|
| September 2026 total | 268,721 |
| September 2025 comparison total | 231,370 |
| September 2026 Mitsubishi | 1,729 |
| September 2026 exact PICK-UP MID | 12,719 |
| Mitsubishi within exact PICK-UP MID | 1,111 |
| PICK-UP SMALL separately excluded | 20,840 |
| September 2026 SUV + MID | 20,846 |
| September 2026 source-classified Chinese brands | 48,555 |
| September 2026 São Paulo state | 63,709 |
| São Paulo state Mitsubishi | 365 |
| São Paulo source municipality names | 629 |
| Unique official municipality matches | 615 |
| January 2016 unknown sales channels | 149,699 |

The 14 unmatched São Paulo source municipality names remain in the table/denominator and are not assigned fabricated geographic IDs. All returned dimension totals, UF totals, and municipality totals reconcile with their corresponding source denominators in these checks.

## View-scoped memory projection

The UI sends `dataView` (`races`, `bubbles`, `mix`, or `maps`) together with `dimension`, `mixKind`, `mapMetric`, and `technology`. This collects and retains only the requested analytical rows. Without `dataView`, the original full API remains unchanged for independent audits and external consumers.

- Races/bubbles retain only the requested dimension, including exact `brands`, `isMIT`, `mitCount`, and valid prior-year values.
- Mix retains only the chosen composition, preserving source links for brand origin and unknown categories.
- Maps retain only UF rows or the chosen UF's municipality rows, with exact technology counts and official geographic identity.
- No inactive municipality history is retained or geographic asset fetched when a prior UI UF selection remains set after switching to another view.
- Intermediate observed counters are retained only through YTD/YoY calculation, then omitted from compact rendering rows. Full totals, coverage and unknown-category disclosures stay available.
- Monthly-mode `monthlyFrames` and `frames` share the same array and frame objects. Projected YTD omits unused monthly history (`monthlyFrames: []`), unless the caller explicitly sets `includeMonthlyFrames: true`.

Projection parity tests compare every retained field against the full API across 14 view/dimension/mix/map configurations in both monthly and YTD modes. Cache tests disable `JSON.stringify` and `TextEncoder`, verify rejection above 24 MiB, and verify early exit before accessing later properties.

Full-history validation is tracked separately by the package's comprehensive audit. This note does not claim that the focused tests above alone establish a full-history UI/runtime pass.
