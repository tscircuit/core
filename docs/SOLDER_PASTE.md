# Standalone solder paste

`<solderpaste>` creates a paste-only aperture without creating copper, a port,
or an electrical connection. It accepts `shape="rect"` with `width`/`height`,
or `shape="circle"` with `radius`, plus PCB position and layer props. Distances
may be numbers in mm or strings such as `"3mm"`. The default layer is `top`.

Place apertures in a footprint to inherit its component's placement, rotation,
and board side. Rectangular apertures retain their orientation under arbitrary
parent rotations. Standalone apertures can also be placed directly on a board.

For example, this footprint has nine stencil windows over one continuous
20 mm-diameter copper contact:

```tsx
import { Fragment } from "react"

<footprint>
  <smtpad shape="circle" radius={10} solderPasteMargin={-10} />
  {[-5, 0, 5].flatMap((pcbX) =>
    [-5, 0, 5].map((pcbY) => (
      <Fragment key={`${pcbX},${pcbY}`}>
        <solderpaste
          shape="rect"
          width={3}
          height={3}
          pcbX={pcbX}
          pcbY={pcbY}
        />
      </Fragment>
    )),
  )}
</footprint>
```

Here `solderPasteMargin={-10}` reduces the circle's automatically generated
paste radius to zero, suppressing that default aperture. The independent
windows do not alter the copper or solder-mask opening. The aperture dimensions
are emitted exactly as specified; the usual SMT pad paste-size reduction does
not apply to `<solderpaste>`.

The output contains `pcb_solder_paste` records with component/group ownership
where applicable and no `pcb_smtpad_id`. Exporters must support independent paste
records to include them in their stencil output.
