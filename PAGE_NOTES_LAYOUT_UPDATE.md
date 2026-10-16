# Compact notes and responsive finishing

Long authored explanations are linked to a collapsible “Notas, metodologia e ajuda desta análise” footer. Each reference opens the footer and focuses the matching note; a return link leads back to the relevant analysis. Native disclosure and buttons remain keyboard accessible.

The integration covers the main application and its secondary views, shared chart/table descriptions, explicitly identified help paragraphs, and scenario method/source disclosures. Short definitions, coverage caveats, missing denominators, experimental warnings and source/reference information remain near the graph. Purely essential paragraphs remain intact. Existing export actions and data contracts are unchanged.

Notes are React portals, owned by the same component lifecycle as the corresponding view. There is no DOM reparenting, mutation observer, accumulated registry or copied stale note cache. Theme colors use existing CSS variables. Responsive adjustments target known controls, grids and horizontally scrollable charts without hiding warnings or applying global SVG dimensions.

Build last: `python scripts/build-page-notes.py`. This idempotent final pass embeds the source, adapts the known call sites and refreshes exact inline-script CSP hashes. Other source-embedding builders may restore original call sites, so rerun this pass afterward.

Validation: seven Node unit/structural tests passed; transformed inline scripts passed `node --check`; applying the transform twice produced identical output; existing contextual export-footer references were preserved. These tests are not a substitute for rendered visual QA. All 19 themes and 360–430 px viewports have not been visually verified in a browser in this environment.
