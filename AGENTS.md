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
