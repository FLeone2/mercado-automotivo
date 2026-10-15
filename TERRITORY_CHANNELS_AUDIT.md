# Territory channel composition audit

## Source and exact classification

- Reviewed input: the repository's `data/manifest.json` and monthly gzip cubes,
  current through September 2026. No source data were changed or generated.
- Exact canonical channel values are `VAREJO`, `VD` and `Não informado`.
  The component recognizes only `VAREJO` as Varejo and `VD` as Venda Direta;
  every other token remains in the explicit “Não informado / outros” category.
- The manifest contains 129 months: 103 have `Tipo Venda`, 24 have no channel
  source field (January 2016–December 2017), and two have the reviewed alias
  `Vendas Diretas` (June and July 2018). Those two cubes already use canonical
  `VAREJO`/`VD`, with 195,066 and 208,551 alias rows and zero conflicts reported.
  The component does not reinterpret the original alias or infer new codes.

## Aggregation and denominator

The existing `channelReference` request removes only `tipo_venda`. Date,
population, UF, municipality and every other active Territórios filter pass
through the same `collectCube` accepted-row checks before UF × channel counting.
No extra network request or separate cube copy is needed.

Each UF denominator is its total across all reference channels, including
unknown tokens. Known counts plus unknown counts must reconcile exactly with
that UF total; otherwise proportions are suppressed. Unknown UFs are preserved
in the list and national total, without inventing polygons.

The all-channel scope is stated above the map and in the evidence/export scope,
description and side panel. When Canal is selected, the card names the selected
channel and explicitly says that this comparison and its list remove only that
filter. The existing map retains its original channel-filter behavior.

September 2026, Automóveis + comerciais leves:

| Scope | Varejo | Venda Direta | Unknown | Total |
| --- | ---: | ---: | ---: | ---: |
| Brazil | 136,656 | 132,065 | 0 | 268,721 |
| BA | 6,395 | 2,784 | 0 | 9,179 |
| SP | 35,830 | 27,879 | 0 | 63,709 |

All 27 state rows reconcile with an independent decoding of the reviewed source
cube. Map and table consume identical derived rows and identical scope metadata.

## Missingness and interpretation

- A UF outside the active geographic selection has null quantities, “—” values
  and an explicit “Fora do recorte geográfico” status.
- A covered UF with no eligible registrations has actual zero volumes and null
  shares, rather than a fabricated 0% composition denominator.
- If no selected month supplies the channel, Varejo/VD counts and shares are
  unavailable. December 2017 therefore retains 204,852 unknown registrations,
  with no fabricated known-channel zero volumes.
- With partly available channel coverage, known counts are explicitly observed
  and potentially partial; percentages are suppressed and polygons are hatched.
  December 2017–January 2018 retains 117,206 Varejo, 58,348 VD and 204,852 unknown
  observations, without normalizing the known channels to a misleading 100%.
- Missing/incomplete monthly source coverage also suppresses proportions.

## Rendering and interaction

The original simplified IBGE UF polygons are reused. Vertical color boundaries
are solved from clipped polygon area, rather than setting the horizontal
gradient width equal to the statistical share. Thus each color's actual area
within the drawn UF corresponds to its share, including multi-island features.
The map explicitly says these divisions are composition graphics and do not
describe the intrastate geographic location of sales.

Varejo is teal, Venda Direta amber, and unknown neutral. Text labels, counts and
percentages accompany color. Hover and keyboard focus show each UF's detail;
click/Enter/Space pin it, Escape and “Limpar seleção” clear it. A separate action
reuses the existing UF exploration handler. The UF list remains below the map.
Responsive CSS stacks map/detail on narrow screens and respects reduced motion.

## Verification

`tests/territory-channels.test.cjs` verifies source/embedded parity, default
27-state reconciliation, national/BA/SP values, both channel selections,
nonempty population/date/UF/municipality/brand/fuel/segment/BD/year filters,
zero versus excluded scope, both real alias-source months, historical gaps,
incomplete source months, unknown tokens and UFs, map/list scope, interaction
handlers and accessible labels. Polygon-area tests cover every real UF at
multiple fractions and its actual September channel share, plus a triangle
whose half-area cutoff differs from half its width.

No browser session was used: browser access is restricted. Automated source,
geometry, data and handler checks do not replace rendered desktop/mobile,
light/dark, focus/hover, evidence/report and export QA. Publication is separate
from this local update.
