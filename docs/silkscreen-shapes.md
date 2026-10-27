# Silkscreen ovals and pills

`<silkscreenoval>` emits a `pcb_silkscreen_oval` record. `radiusX` and
`radiusY` are the ellipse's local radii. `<silkscreenpill>` emits a
`pcb_silkscreen_pill`; `width` and `height` include the rounded ends. A pill
can be horizontal or vertical, and equal dimensions form a circle.

```tsx
<chip
  name="U1"
  footprint={
    <footprint>
      <silkscreenoval radiusX="3mm" radiusY="1mm" pcbX={-4} pcbRotation={30} />
      <silkscreenpill width="6mm" height="2mm" pcbX={4} layer="top" />
    </footprint>
  }
/>
```

Both accept shared PCB layout props, including `pcbX`, `pcbY`, and
`pcbRotation` (counterclockwise degrees). Dimensions accept numbers in mm or
unit strings. Silkscreen belongs on `top` or `bottom`; `top` is the default.
Parent placement and footprint layer flipping apply to the center and
orientation together. The emitted dimensions remain in the shape's local axes.

Circuit JSON footprints and cached/imported subcircuits reconstruct both
shapes, including their local rotation. Board packing also transforms their
orientation with their center. The Circuit JSON schemas for these shapes do
not define configurable stroke width or fill properties.

`SilkscreenOval`, `SilkscreenPill`, `SilkscreenOvalProps`, and
`SilkscreenPillProps` are exported from `@tscircuit/core`.
