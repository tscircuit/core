# Explicit PCB trace routes

`<pcbtrace>` draws physical copper in its containing footprint's local PCB frame
(right-handed, +X right, +Y up, +Z above; distances in mm). Parent placement,
rotation and layer flipping are applied to the resulting points. It does not
create logical connectivity; use `<trace>` for logical connections.

```tsx
<pcbtrace
  layer="top"
  thickness="0.2mm"
  route={[{ x: -2, y: 0 }, { x: 2, y: 0 }]}
/>
```

Coordinate routes use `layer` (default `top`) and `thickness` (default 0.15 mm).
A point's `trace_width` overrides the thickness at that point; it does not change
the default for later points. Coordinates and widths accept distance strings.
For a layer transition, supply both `via: true` and `to_layer`. The route retains
a wire endpoint on each side of the via at the same position:

```tsx
<pcbtrace layer="top" thickness={0.3} route={[
  { x: -4, y: 0 },
  { x: 0, y: 0, via: true, to_layer: "bottom" },
  { x: 4, y: 2 },
]} />
```

The `PcbTrace` class also continues to accept complete Circuit JSON route arrays
(`wire`, `via`, and `through_pad`) and `source_trace_id` for existing importers.
These detailed routes retain their per-point layers, widths, taper parameters,
port and pour references, and via dimensions/tenting. Trace-level defaults do not
overwrite detailed route fields. A route uses either coordinate points or
complete Circuit JSON points; mixing formats is not supported.
