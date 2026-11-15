# New York: four transparent building slots

Place PNGs here as `building-01.png` through `building-04.png`.
Set `new-york-01` through `new-york-04` in `src/game/visualAssets.ts` to
`/assets/buildings/new-york/building-01.png` (and the corresponding numbers).
All 30 New York locations use the four variants in stable order.
Use a consistent square canvas, transparent background, and ground-level base
at the bottom center. Recommended export: 1024 × 1024, with consistent scale.
The existing art stays active until a slot is configured; broken replacements
fall back to the existing art. Pins and signs animate independently of artwork.

For newly uploaded binary media, use lovable-assets and import the resulting
project .asset.json pointer in the registry instead of copying the binary.