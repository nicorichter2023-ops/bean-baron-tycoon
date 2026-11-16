<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Game logic lives in src/engine/ (user-supplied pure types.ts/engine.ts with processTurn, plus save.ts for localStorage with schemaVersion migrations); content and createInitialState live in src/data/; UI in src/game/ only calls engine functions — keeps engine/content swappable.
- Management navigation exposes action panels directly through SectionFilter; SceneView and MapTab remain optional visual views using the same engine actions.
- Run weekly gameplay through processManagementWeek in src/engine/management.ts; it wraps the base engine and laboratory, journals real action cash movements, and persists HQ/accounting in schema-versioned GameState so reports reconcile without duplicate charges.
- Store equipment is persisted in the main save and defined by pure equipment actions/effects; upgrades capitalize incremental costs and never downgrade, keeping weekly simulation, accounting and visual loadouts aligned.
- New uploaded media is served through asset JSON pointers; sprite atlases use a 4×4 grid to limit requests and keep scene composition browser-safe.
- Register the public offline service worker only in production; cache only successful same-origin public GET assets and navigations, never authenticated requests or API responses.
- Sheet artwork is cut into public/assets/sheets/<sheet>/<index>.webp and referenced only through src/game/sheetArt.ts index maps, so re-cutting a sheet needs edits in one place.
- Preserve the complete uploaded master JSON in src/data; adapters expose engine units, while world.ts owns persisted travel, research, property occupancy and catalog actions so city UI never mutates economic rules.
- City maps use existing indexed artwork with react-zoom-pan-pinch and deterministic per-city property placement; old owned locations remain in migrated saves instead of being reassigned to new leases.
- All master cities use shared isometric projection and x+y-sorted layers with alpha-trimmed artwork on curb foundations; cityGeography defines regional water/parks, with no moving traffic to intersect buildings.
- Neighborhood simulation and inspector share src/engine/neighborhood.ts slot placement and bounded effects; map ordering uses that same pure layout so shown neighbors match weekly economic rules.
- Café cutaways derive every visual piece from persisted store tier and equipment; CMO perks multiply campaigns and CTO points accelerate research, with no presentation-side charges.
- Visual replacement slots live in src/game/visualAssets.ts with image-error fallbacks; CSS effects animate separate presentation layers and respect reduced motion so art swaps never alter gameplay or hit targets.
- Long-term progression (ranks, 7 store stages, levers, weekly goals, achievements, event gating) lives in src/engine/progression.ts with pure content in src/engine/unlocks.ts; weekly play runs through processProgressWeek, which wraps processManagementWeek and patches the same accounting row so lever/goal cash reconciles.
- Store stages refine engine tiers (stages map onto tiers 1/2/3) instead of replacing them, so the base engine and old saves stay valid.
- Café depth (menu, 5-level gear, decor, barista XP, 32 research nodes, rival pressure) lives in src/engine/cafe.ts + cafeContent.ts, persisted as GameState.cafe and applied in processProgressWeek; gear syncs legacy equipment upwards only so old effects and saves stay valid.
- City maps: painted per-city images with precomputed land pin spots in src/data/cityMaps.ts; isometric scene is the fallback when an image fails.
- City map pins open the property bottom sheet (.property-sheet) for free/rival spots; focus jumps select too. Café rooms are painted per store group × look (src/assets/rooms/g<group>-<look>.webp with transparent backdrop via roomLayouts.ts, staged on the CSS --room-stage gradient, looks = moods × variants edited from one base scene, no colour filters); the editor commits a draft through applyDesign so every combination stays coherent and is charged once.
- Empire layer (ventures, supply upgrades, chain actions, property/rival deals, auto campaigns, C-level automation) lives in src/engine/empire.ts as optional GameState.empire; weekly play runs through processEmpireWeek, which wraps processProgressWeek and patches the same accounting row so extra cash reconciles.
- Research and marketing each have exactly one hub (ResearchHub, MarketingHub); MasterCatalog embeds subsets via `only`, and café views link there instead of duplicating panels.

- Management sections switch by horizontal swipe on the content area; each master catalog group is embedded in its topical section via MasterCatalog `only` instead of a separate development menu.
- The production weekly entry point is processTycoonWeek in src/engine/tycoon.ts, wrapping the existing empire/progression/management chain and patching its one accounting row; schema-versioned tycoon state and pure tycoonContent keep new channels, customer liabilities and legacy saves coherent.
- Five primary navigation groups mount each economic hub once; store details are shared across maps, menus and store lists to prevent presentation-specific upgrade actions.
- Master motifs are individually trimmed transparent files (src/assets/hubs/master/<kind>.webp via masterArt.ts) instead of an atlas, so each fills its frame without white edges. The next-week control lives as the centre item of the bottom nav, so it adds no extra height.
- C-level hiring runs through job postings in src/engine/recruiting.ts; generated hires persist in world.hired and every perk lookup uses candidateOf, so legacy master-candidate saves keep working.
