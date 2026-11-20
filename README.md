# Bean Baron Tycoon

Erstelle ein mobiles Tycoon-Spiel ('Coffee Empire') im Stil von Coffee Inc 2+, optimiert als PWA für Smartphones (Galaxy S21 FE).



Anforderungen:

- Feste Top-Bar: Barvermögen, Firmenwert, Datum/Woche, Kaffeepreis-Ticker, 'Nächste Woche'-Button.

- 4 Haupt-Tabs unten:

  1. Imperium (Übersicht Cafés, Röstereien, Holding, Upgrades)

  2. Weltkarte (Übersicht Städte, filterbar nach Region/Biom)

  3. Markt & B2B (Bohnen-Terminmarkt, B2B-Lieferverträge)

  4. Finanzen & M&A (Kredite, Aktienmarkt, VC-Startups)

- Technischer Aufbau: React, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, LocalStorage-Savegame mit schemaVersion.

- Bereite eine modulare Ordnerstruktur vor (src/engine/ und src/data/), damit wir im nächsten Schritt unsere fertige Game-Engine und das Content-JSON einsetzen können. Verwende vorerst 2 Mock-Städte.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bean-baron-tycoon.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3f835c0c-f519-4545-8b81-19f76cadcc30).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
