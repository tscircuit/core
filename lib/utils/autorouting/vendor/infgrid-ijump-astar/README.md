# @tscircuit/infgrid-ijump-astar (vendored)

Self-contained copy of `@tscircuit/infgrid-ijump-astar@0.0.35`, vendored into core
because the upstream repo (`tscircuit/autorouting`) is archived and can no longer
publish fixes. Core imports `MultilayerIjump` from here instead of the npm package.

## What's here

- `index.js` — the published `dist/index.js` bundle with one patch applied
  (see below). The package ships only compiled JS for the multilayer algorithm
  (no TypeScript source), and its TS sources depend on unpublished monorepo
  packages (`solver-utils`, `solver-postprocessing`), so the compiled bundle is
  the only self-contained artifact.
- `index.d.ts` — the published `dist/index.d.ts` types, unmodified.
- `README.md` — this file.

## Patch applied

`MultilayerIjump.getNeighbors` no longer pushes a "cross the goal axis" stop for
an open direction when the goal is behind (or level) along that direction. The
goal-axis branch above already handles the goal being ahead; the removed push
used `goalDistAlongTravelDir` (an absolute distance) in the wrong direction,
emitting a neighbor at `node + dir * |goal - node|` mirrored away from the goal.
This is the fix for tscircuit/core#3927 / tscircuit/autorouting#92.

## Re-vendoring

If the upstream package is ever fixed and republished, replace `index.js` /
`index.d.ts` with the new published `dist/` files and re-apply the patch above,
or switch the imports back to `@tscircuit/infgrid-ijump-astar` and delete this
directory.

Do not reformat these files — they are listed in `biome.json` `files.ignore`.
