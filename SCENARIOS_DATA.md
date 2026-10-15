# Cenários: audited data and statistical foundation

Separate integration artifact. Does not change index.html or existing Evolution modules.

## Run

Python 3.12, NumPy (no statsmodels required).

```
python scripts/fetch_scenario_sources.py --end 2026-10-15
python scripts/build_regional_sources.py
python scripts/build_scenarios.py --repo ../mercado-automotivo
python -m unittest discover -s tests -v
```

Copy `data/scenarios/` to the dashboard's `data/scenarios/`. The five-tab and per-chart availability contract is `manifest.json`. Scope is fixed national light vehicles, with Jan–Sep 2026 geography/composition. Global interactive filters MUST NOT appear to recompute these files. `monthly.json` uses 129 actual source months and excludes heavy rows. All totals reconcile with the frozen Phase 2 national total (24,541,931 registration rows). Duplicates remain as documented by the source: these are not unique vehicles.

## Files / contracts

- `monthly.json`: monthly registrations, exact-brand Mitsubishi, share, YoY, histogram bins, quantiles and calendar-month distributions. No normal distribution assumption.
- `regional.json`: municipal YTD counts/share, official IBGE code or explicit failed join. Matching is exact normalized name + UF, never fuzzy. Codes match `data/geography/{UF}.json` feature.code. Join coverage is reported by rows and keys. Unmatched is not zero. Official SVG paths are state-local projections, not geographic coordinates. No national 3D mesh or invented city coordinates.
- `selectedSample`: only 30 preselected Phase 2 municipalities, not representative. Official-source GDP per capita 2023 and population 2026 are separate fields. GDP measures local production, not family income. One source spelling currently fails the strict join (Campos dos Goitacazes / Campos dos Goytacazes), explicitly marked; 29 reconcile. Do not extrapolate this selection or silently show it as all Brazil.
- `composition.json`: complete YTD original-country/propulsion/body aggregates. Sankey is composition of the same registrations, not customer flows.
- `external_sources.json`: official URLs, retrieval time, hashes, units, aggregation, metadata status, actual latest observations and missing months. Failed API calls do not produce numeric data. All five requested BCB series are available: effective monthly Selic, month-end Selic target, monthly vehicle financing rates and credit concessions, and monthly average USD PTAX sale. Credit/rate observations end August 2026; other monthly values end September 2026. Running October daily observations are not treated as a complete month.
- `macro_analysis.json`: exploratory macro-leading lags 0–12. Registration YoY and macro YoY/percentage-point differences are residualized against month effects and trend. No naive p-values, causal claims or manufactured elasticities. Multiple correlated lags remain a limitation.
- `forecasts.json`: new strictly time-ordered rolling experiment, plus unchanged original Phase 2 ETS/baseline metrics and provenance. Do not compare scores across their different test windows/protocols.
- `audit.json`: manifest and all compressed cube hashes, monthly reconciliations and quality warnings.

## Forecast safeguards and results

Naive, seasonal naive and fixed seasonal-trend OLS are compared. At least 96 consecutive observations and recent volume/nonzero thresholds are required. Validation targets end before an untouched 24-month test period. Every rolling fold fits only past observations; seasonal MASE denominator uses the training sample. No future macro values, no zero-denominator MAPE. Each target forecast explicitly records training end and target index. Current source/classification vintages cannot reconstruct historical publication vintages and are disclosed.

The validation-selected seasonal-trend model does **not** beat the best baseline on the untouched test for either series. Approximate interval calibration also weakens out of sample. Outputs are `qualityStatus: failed_validation`, `usage: exploratory_only`; these are experimental diagnostics, not a validated operational forecast. Do not present the fan as reliable just because it is rendered. Do not select a replacement using the same held-out test and then claim independent validation. A new predeclared experiment or subsequent untouched observations are needed.

Intervals are horizon-specific empirical pre-test residual quantiles, expanded to include the point forecast and clipped at zero. They are not normal-theory confidence intervals, and nominal 80/95% coverage is not guaranteed. Actual held-out coverage is provided.

Two-factor scenario surfaces are blocked until real exogenous data, appropriate release lags, an explicit conditional specification and independent out-of-sample validation exist. No financial advice or invented response surface.

## Known limitations / next work

National official population (5,571 municipalities, 2026) and GDP per capita (5,570, 2023) were recovered through SIDRA and IBGE FTP. The new municipality code 5101837 has no 2023 GDP and is explicitly missing. `socioeconomic.json` holds the full official data; `regional.json.municipalities` has code-joined population, GDP and registrationsPer1000. Historical geography harmonization remains incomplete. Strict municipality spelling mismatches need a reviewed alias crosswalk. State-local 3D polygon extrusion is supported by the existing projected SVG paths, but a stitched national geographic mesh requires proper geography. Source-backed household income is not interchangeable with GDP per capita. Fleet/locadora/headquarter registration bias prevents interpreting counts per resident as household demand.
