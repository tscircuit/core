# SMT pad Circuit JSON field loss

These are reproductions of six missing **properties on `pcb_smtpad`**, not missing
element types. The exact radius field is `pcb_smtpad.rect_border_radius`.

Verified against core `21e36c918b67ea3182b811385cfbac89bd8bbd99` (v0.0.2203)
and the [Circuit JSON schema at `0556e0c`](https://github.com/tscircuit/circuit-json/blob/0556e0c50348649422a8beb6e723d3873daddcbd/src/pcb/pcb_smtpad.ts).
The local dependency resolution used `circuit-json@0.0.534`,
`@tscircuit/props@0.0.709`, and `circuit-to-svg@0.0.453`.

| Circuit JSON property | Schema shapes | Native core rendering | Circuit JSON footprint import |
| --- | --- | --- | --- |
| `rect_border_radius` | `rect`, `rotated_rect` | `rectBorderRadius` is accepted for `rect` but never emitted, including when parent rotation produces `rotated_rect`. | Lost for both rectangular shapes. |
| `soldermask_margin_left` | `rect`, `rotated_rect` | `solderMaskMarginLeft` is accepted but not emitted. | Not mapped to the component. |
| `soldermask_margin_top` | `rect`, `rotated_rect` | `solderMaskMarginTop` is accepted but not emitted. | Not mapped to the component. |
| `soldermask_margin_right` | `rect`, `rotated_rect` | `solderMaskMarginRight` is accepted but not emitted. | Not mapped to the component. |
| `soldermask_margin_bottom` | `rect`, `rotated_rect` | `solderMaskMarginBottom` is accepted but not emitted. | Not mapped to the component. |
| `solderpaste_margin` | All six SMT pad shapes | Explicit `solderPasteMargin` changes paste geometry but is not saved on the pad record. | Not read from the pad record; the rectangular pad repro regenerates default paste geometry. |

## What already works

- `cornerRadius` emits `corner_radius` for rectangular pads. Rounded corners are
  therefore **not wholly unsupported**. This is a separate field from
  `rect_border_radius`; the radius output repro includes a working control.
- Uniform `solderMaskMargin` emits `soldermask_margin` in native rendering. The
  directional output repro checks that this working field remains present.
- Native `solderPasteMargin` correctly changes the aperture size. The paste output
  repro checks all six shapes with `-0.1`, `0`, and `+0.1` mm, before checking the
  missing metadata. It verifies circle radii, rectangle/pill dimensions, and
  polygon bounds against emitted paste geometry.
- `rect_border_radius` is emitted by `PlatedHole`; that does not establish support
  for `SmtPad`.

## Where the values are lost

[`SmtPad.doInitialPcbPrimitiveRender`](../../lib/components/primitive-components/SmtPad.ts)
reads `solderMaskMargin`, `solderPasteMargin`, and `cornerRadius`. Its pad insertion
branches do not write any of the six properties above. The paste margin is used
when constructing separate `pcb_solder_paste` records.

[`createComponentsFromCircuitJson`](../../lib/utils/createComponentsFromCircuitJson.ts)
passes `rect_border_radius` to `rectBorderRadius` for imported `rect` pads, but
the renderer ignores that prop. The `rotated_rect` import branch only maps
`corner_radius`, and `RotatedRectSmtPadProps` has no `rectBorderRadius` prop in the
tested props version. None of the SMT pad import branches maps the directional
margin fields or reads `elm.solderpaste_margin`.

The importer has a separate `preserveSolderPaste` path for explicit aperture
records. The paste import repro deliberately supplies **pad records only** through
the public `chip.footprint` API, so explicit apertures cannot hide the field loss.

For a 2 x 1 mm rectangular pad:

| Imported `solderpaste_margin` | Expected paste width x height | Actual paste width x height | Actual output margin |
| --- | --- | --- | --- |
| `-0.1` | `1.8 x 0.8` mm | `1.4 x 0.7` mm | absent |
| `0` | `2 x 1` mm | `1.4 x 0.7` mm | absent |
| `+0.1` | `2.2 x 1.2` mm | `1.4 x 0.7` mm | absent |

## Reproduce

```sh
bun install
bun test tests/repros/repro-smtpad-*-*.test.tsx
```

The six files separately cover native output and Circuit JSON footprint import
for radius, directional mask margins, and paste margins. Import fixtures are
validated through `pcb_smtpad.parse` before rendering. Each file has one
`test.failing` containing only the desired behavior assertion; rendering,
schema/control checks, and awaited visual snapshots run in `beforeAll` so an
unrelated setup or snapshot error cannot be counted as an expected failure.

The footprint boundary casts the validated pads to `FootprintProp` because its
legacy array type does not include the full `PcbSmtPad` union (including
`rotated_rect`). This does not bypass Circuit JSON validation.

The suite passes while the known gaps remain. Replacing `test.failing` with
`test` in these six files produces **six assertion failures** on the base commit.
Once the corresponding behavior is fixed, remove `.failing` and update the
snapshots and labels that document the current behavior. The snapshots currently
show the bug, not the proposed fixed output.

This is a reproduction-only change. It adds no implementation changes and makes
no claim of an exhaustive audit of other Circuit JSON types or properties.
