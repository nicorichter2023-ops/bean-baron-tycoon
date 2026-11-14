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
- SceneView and MapTab form the visual presentation layer; SectionFilter exposes existing action panels in sheets, so economic actions stay on the existing engine path.
- New uploaded media is served through asset JSON pointers; sprite atlases use a 4×4 grid to limit requests and keep scene composition browser-safe.
- Register the public offline service worker only in production; cache only successful same-origin public GET assets and navigations, never authenticated requests or API responses.
- Sheet artwork is cut into public/assets/sheets/<sheet>/<index>.webp and referenced only through src/game/sheetArt.ts index maps, so re-cutting a sheet needs edits in one place.
