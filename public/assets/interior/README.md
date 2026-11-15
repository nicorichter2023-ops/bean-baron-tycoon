# Café interior slots

`cafe-interior.png`: transparent 1376 × 768 canvas, matching the existing
interior framing. The espresso-machine center is at 33% x / 48% y.
`espresso-machine.png`: square transparent crop, grounded at bottom center.

Configure `cafe-interior` and `espresso-machine` in `src/game/visualAssets.ts`
with `/assets/interior/cafe-interior.png` and
`/assets/interior/espresso-machine.png`, respectively. Uploaded media should
instead be served through imported .asset.json pointers. The machine wrapper
owns the steam position, so swapping the machine retains the animation.
Adjust `.cafe-machine-slot` and `.bean-baron-neon` in src/styles.css if the
replacement interior places its counter or signage differently.