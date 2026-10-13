# Standalone solder paste apertures

`<solderpaste>` defines a stencil opening independently of copper geometry.
Use it for windowed paste patterns over a continuous exposed pad.
It emits a `pcb_solder_paste` record without creating an SMT pad or an
electrical connection.

Supported shapes:

- Rectangle: `shape="rect"`, `width`, `height`.
- Circle: `shape="circle"`, `radius`.

Use `pcbX` and `pcbY` for position and `layer="top"` (the default) or
`layer="bottom"` for the paste face. Dimensions accept numbers in mm or
distance strings such as `"1.2mm"`. Apertures inherit parent rotations,
footprint side flips, and component layout moves. The existing props schema
does not expose a per-aperture `pcbRotation`; rotate the containing footprint,
component, or group.

## Six windows over one copper pad

An SMT pad normally generates its own paste opening. To replace it with
independent windows, use the existing `solderPasteMargin` property to shrink
that automatic opening to zero. This leaves the copper and solder mask
unchanged. The value below is specific to this 4 × 5 mm pad.

```tsx
<chip
  name="U1"
  footprint={
    <footprint>
      <smtpad
        shape="rect"
        width={4}
        height={5}
        layer="top"
        portHints={["1"]}
        solderPasteMargin={-2}
      />
      {[-1, 1].flatMap((pcbX) =>
        [-1.6, 0, 1.6].map((pcbY) => (
          <solderpaste
            key={`${pcbX},${pcbY}`}
            shape="rect"
            width={1.6}
            height={1.2}
            pcbX={pcbX}
            pcbY={pcbY}
            layer="top"
          />
        )),
      )}
    </footprint>
  }
/>
```

The result is one copper pad and six separate paste apertures. The window
dimensions are illustrative; choose the production pattern using the part's
package recommendations and the assembler's stencil requirements.

Independent apertures do not automatically suppress nearby pads' generated
paste. Exporters must consume the `pcb_solder_paste` records, including records
without a `pcb_smtpad_id`, to preserve the pattern.
