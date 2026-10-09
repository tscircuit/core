# Courtyard overrides

Add `courtyardrect`, `courtyardcircle`, or `courtyardoutline` directly inside a
component to replace the courtyards supplied by its footprint:

```tsx
<capacitor name="C3" capacitance="100nF" footprint="cap0402">
  <courtyardrect width="1.66mm" height="0.74mm" />
</capacitor>
```

When a component has explicit courtyard children, core emits those courtyards
and suppresses all courtyards from its footprint. Multiple explicit shapes are
retained together, including shapes on different layers. Without explicit
courtyard children, all footprint courtyards remain active.

Courtyards inside a `<footprint>` remain footprint defaults. This also applies
to footprinter strings, React footprint props, Circuit JSON footprints, URLs,
library imports, and supplier footprints loaded asynchronously.

The override uses the existing component rotation and layer transforms. Pads,
holes, silkscreen, and CAD models keep their original geometry. PCB packing,
overlap checks, and rendered output use the selected courtyard geometry.

This changes the previous additive behavior for courtyard children directly
inside a component. To supplement a footprint's courtyard, define all desired
shapes together inside that footprint, or declare the complete courtyard set as
explicit children of the component.
