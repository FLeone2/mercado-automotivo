# Header and territory channels update

## Interface

- A hand-authored SVG combines a vehicle silhouette and small chart bars, with
  an “Inteligência de mercado / Mercado Automotivo” identity in the green glass palette.
- Seven navigation areas move into the top header, centered on wide screens and
  wrapped on narrow screens. Existing routes and secondary navigation remain intact.
- Universe moves to the additional-filters disclosure. Grupo modelo stays visible
  beside `+ filtros`, using its original source field and existing filter handlers.
- Processing status appears at the bottom of every page, including Ranking.
- Territórios adds a second Brazil map below the current one, splitting each
  state's drawn area proportionally into Varejo and Venda Direta, with a neutral
  unknown category. Hover/focus details and a UF list share the same data scope.
- The comparison clearly labels its all-channel reference, retains every other
  territory filter and suppresses percentages when source coverage is incomplete.
  See `TERRITORY_CHANNELS_AUDIT.md` for reconciliation and geometry verification.

## Verification limits

The supplied screenshot was visually inspected. Automated component, data and
syntax checks are run against this package. Interactive browser rendering is not
verified because browser access is restricted. No deployment or remote push is
claimed by this local update.

## Apply the update

The ZIP is an overlay for the existing repository. Extract its files at the
repository root, preserving the existing `data/` directory and all other files.
It is not a standalone replacement for the complete site. The ZIP includes no
monthly cubes, geographic source files or scenario datasets.

Review the diff on an update branch before merging. The existing GitHub-to-
Cloudflare workflow remains the publication route. Verify the live result after
that workflow completes, especially mobile header layout, filter disclosures,
keyboard navigation and the territory channel map.
