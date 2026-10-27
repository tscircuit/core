# Dimensions in part views

Nest dimensions inside a part view. They inherit its `partRef`, direction, and
section; core computes the measured text and paper positions.

```tsx
<assembly.drawing.partview
  partRef=".housing"
  name="plan"
  direction="z+"
  width="80mm"
  height="60mm"
>
  <assembly.drawing.dimension widthOfView />
  <assembly.drawing.dimension heightOfView />
  <assembly.drawing.dimension edgeRef=".mounting_outline" />
</assembly.drawing.partview>
```

`widthOfView` and `heightOfView` measure the visible geometry's horizontal and
vertical extents in model millimeters, including section cuts. Named outlines
measure their dominant projected extent. These are linear extent dimensions,
not curve lengths, diameters, or angles. Core chooses a fitting conventional
scale, places width dimensions below and height dimensions to the left, and
spaces additional dimensions automatically. Values use up to two decimal places.

`edgeRef` selects a name authored by the model, for example:

```tsx
<jscad.extrudeLinear height={6} topOutlineName="mounting_outline">
  <jscad.rectangle size={[20, 12]} />
</jscad.extrudeLinear>
```

A relative `.mounting_outline` searches only models selected by this view.
`.housing > .mounting_outline` qualifies the part when a view contains multiple
parts. Missing or ambiguous names produce an error rather than measuring an
arbitrary mesh edge. Each named feature must identify one native contour.

The first reader supports native JSCAD operation plans, including printed-part
JSX compiled to plans. View extent dimensions also work with imported CAD models
and boards; native feature names in STEP/glTF and modelprinter strings are not
resolved yet.

Circuit JSON contains only resolved `drawing_dimension_line` strokes, witness
attachments, formatted measurement text, and optional model-feature names. It
never contains native edge definitions or authoring presets. Exporters draw
these records without measuring geometry again.
