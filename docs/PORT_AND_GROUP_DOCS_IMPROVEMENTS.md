# Proposal: improve the `<port />` and `<group />` documentation

## Why this is needed

The current `<port />` page describes ports only as children of `<symbol />`
and omits the `connectsTo` prop. The current LED-matrix example on the
`<group />` page declares public row and column ports, but does not show which
internal LED pins they connect to.

The documentation should teach both supported port contexts:

- Inside `<symbol />`, a port defines a custom schematic pin.
- As a direct child of `<group />` or `<subcircuit />`, a port defines part of
  the module's public interface. `connectsTo` maps that public port to one or
  more internal component ports.

## Changes to the `<port />` page

### Correct the overview

Replace the statement that `<port />` can only be used inside `<symbol />` with
the following.

> `<port />` defines a named connection point. Its behavior depends on its
> parent:
>
> - Inside `<symbol />`, it defines the position and direction of a custom
>   schematic pin.
> - As a direct child of `<group />` or `<subcircuit />`, it defines a public
>   module port. When the parent uses `showAsSchematicBox`, the port appears as
>   a pin on the collapsed module symbol.

### Document all relevant props

| Prop | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Public port name. A port must have `name` or `pinNumber`. |
| `pinNumber` | `number` | Optional numeric pin identity; it can also provide the default name. |
| `connectsTo` | `string \| string[]` | For a direct group port, the internal component-port selector or selectors connected to this public port. One source trace is created for each target. |
| `direction` | `"left" \| "right" \| "up" \| "down"` | Schematic-facing direction. For a schematic-box group, it also determines the default side when `schPinArrangement` is absent. It does not select electrical polarity. |
| `schX`, `schY` | `number` | Positions a port inside a custom symbol. These coordinates are not required for a schematic-box group port. |
| `schStemLength` | `number` | Length of the schematic stem extending from the port. |
| `aliases` | `string[]` | Alternative names by which the port may be selected. |
| `layer`, `layers` | `string`, `string[]` | Optional PCB layer information. A group port normally inherits layers from the first resolved `connectsTo` target. |

Add this selector note below the table:

> A `connectsTo` selector uses the internal component name and a port name or
> alias, such as `"R1.pin1"` or `"D1.anode"`. An array connects one public port
> to every listed target. The first resolved target supplies the public PCB
> port's position and layers.

### Add a complete group-interface example

```tsx
export default () => (
  <board width="20mm" height="12mm">
    <group
      name="FILTER"
      showAsSchematicBox
      schTitle="RC Filter"
      pcbX={-4}
    >
      <port name="VIN" direction="left" connectsTo="R1.pin1" />
      <port name="VOUT" direction="right" connectsTo="R1.pin2" />
      <resistor name="R1" resistance="1k" footprint="0402" />
    </group>

    <resistor
      name="R_SOURCE"
      resistance="10k"
      footprint="0402"
      pcbX={-8}
      connections={{ pin1: "net.VCC", pin2: "FILTER.VIN" }}
    />
    <resistor
      name="R_LOAD"
      resistance="10k"
      footprint="0402"
      pcbX={4}
      connections={{ pin1: "FILTER.VOUT", pin2: "net.GND" }}
    />
  </board>
)
```

Explain the two selector scopes directly below the example:

> `R1.pin2` is internal to the group. `FILTER.VOUT` is the public selector used
> by the parent circuit. The resulting connectivity includes
> `FILTER.VOUT <-> R1.pin2` and `R_LOAD.pin1 <-> FILTER.VOUT`.

Also state that a group port can appear before its target component in JSX;
port resolution is not dependent on child order.

The same interface pattern works for `<subcircuit showAsSchematicBox>`. A
parent connection such as `SUBFILTER.VOUT` renders to the public box port while
`connectsTo="R1.pin2"` preserves the internal electrical connection.

### Add a multiple-target example

```tsx
<port
  name="ROW1"
  direction="left"
  connectsTo={["D1.anode", "D2.anode", "D3.anode"]}
/>
```

> This creates one public port and three internal source traces. It is useful
> for shared internal nets such as LED-matrix rows and columns.

## Changes to the `<group />` page

### Explain group ports before showing a collapsed module

Add the following near **Showing a group as a schematic box**:

> Only direct child `<port />` elements become pins on a collapsed group. Use
> each port's `connectsTo` prop to define which internal component ports it
> exposes. `direction` and `schPinArrangement` control how those public pins
> are drawn; they do not replace the electrical mapping.

### Keep `group.connections` as a shorthand

The existing `connections` section should explain its relationship to explicit
ports:

> `<group connections={{ ... }}>` is shorthand for declaring public ports and
> connecting them to internal targets. Each key is a public port name and each
> value is one internal selector or an array of selectors. When using this
> shorthand for a PCB module, omit explicit ports so the generated ports carry
> the same target mapping.

Use explicit ports with their own `connectsTo` values when the example needs
per-port props such as `direction`, `aliases`, or `pinNumber`. The group-level
shorthand is useful when only the mapping is needed.

## Corrected LED-matrix section

### Explain the topology before the example

Add this text before **Example: LED matrix module**:

> A bare list of row and column ports describes only the module boundary. The
> `connectsTo` values below define which LED pins belong to every row and
> column. This example uses row anodes and column cathodes. Swap the polarity
> consistently if the intended driver uses the opposite arrangement.

### Replace the example with a fully connected matrix

```tsx
export default () => (
  <board width="34mm" height="22mm">
    <group
      name="MATRIX"
      showAsSchematicBox
      schTitle="3×3 LED Matrix"
      pcbGrid
      pcbGridCols={3}
      pcbGridRows={3}
      pcbGridGap="3mm"
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["ROW1", "ROW2", "ROW3"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["COL1", "COL2", "COL3"],
        },
      }}
    >
      <port
        name="ROW1"
        direction="left"
        connectsTo={["D1.anode", "D2.anode", "D3.anode"]}
      />
      <port
        name="ROW2"
        direction="left"
        connectsTo={["D4.anode", "D5.anode", "D6.anode"]}
      />
      <port
        name="ROW3"
        direction="left"
        connectsTo={["D7.anode", "D8.anode", "D9.anode"]}
      />
      <port
        name="COL1"
        direction="right"
        connectsTo={["D1.cathode", "D4.cathode", "D7.cathode"]}
      />
      <port
        name="COL2"
        direction="right"
        connectsTo={["D2.cathode", "D5.cathode", "D8.cathode"]}
      />
      <port
        name="COL3"
        direction="right"
        connectsTo={["D3.cathode", "D6.cathode", "D9.cathode"]}
      />

      <led name="D1" color="red" footprint="0603" />
      <led name="D2" color="red" footprint="0603" />
      <led name="D3" color="red" footprint="0603" />
      <led name="D4" color="red" footprint="0603" />
      <led name="D5" color="red" footprint="0603" />
      <led name="D6" color="red" footprint="0603" />
      <led name="D7" color="red" footprint="0603" />
      <led name="D8" color="red" footprint="0603" />
      <led name="D9" color="red" footprint="0603" />
    </group>

    <netlabel net="ROW1" connectsTo="MATRIX.ROW1" />
    <netlabel net="ROW2" connectsTo="MATRIX.ROW2" />
    <netlabel net="ROW3" connectsTo="MATRIX.ROW3" />
    <netlabel net="COL1" connectsTo="MATRIX.COL1" />
    <netlabel net="COL2" connectsTo="MATRIX.COL2" />
    <netlabel net="COL3" connectsTo="MATRIX.COL3" />
  </board>
)
```

This example creates six public group ports and eighteen internal source
traces. The net labels demonstrate how the parent circuit uses the public
`MATRIX.ROW1` through `MATRIX.COL3` selectors.

### Add an explicit connectivity table

| Public module port | Internal LED pins |
| --- | --- |
| `ROW1` | `D1.anode`, `D2.anode`, `D3.anode` |
| `ROW2` | `D4.anode`, `D5.anode`, `D6.anode` |
| `ROW3` | `D7.anode`, `D8.anode`, `D9.anode` |
| `COL1` | `D1.cathode`, `D4.cathode`, `D7.cathode` |
| `COL2` | `D2.cathode`, `D5.cathode`, `D8.cathode` |
| `COL3` | `D3.cathode`, `D6.cathode`, `D9.cathode` |

## Regression coverage

The core regression examples corresponding to these documentation changes are:

- `tests/features/group-ports/group-ports03-exposed-subcircuit-port.test.tsx`
  verifies that parent components receive real schematic traces to public
  subcircuit-box ports rather than disconnected fallback net labels.
- `tests/features/group-ports/group-ports05-port-connectsto-regression.test.tsx`
  verifies scalar `connectsTo`, source connectivity, and JSX child-order
  independence.
- `tests/features/group-ports/group-ports06-port-connectsto-array.test.tsx`
  verifies the 3×3 matrix, six public ports, and eighteen internal source
  traces.

All three tests include schematic and PCB snapshots that can be reused as references
when updating the docs.

## Acceptance criteria

- The `<port />` page no longer says ports are restricted to `<symbol />`.
- `connectsTo` is documented as `string | string[]` and includes selector
  examples.
- The relationship between explicit ports and `group.connections` is clear.
- The filter example shows both the internal mapping and the public selector.
- The LED-matrix example maps every row and column to the intended LED pins.
- The docs distinguish electrical connectivity from schematic arrangement and
  PCB positioning.
