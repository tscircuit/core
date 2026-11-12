# Standalone subcircuit schematic interfaces

Render a `<subcircuit>` as the sole root element to show its internal schematic
inside a boundary with its public terminals. Existing declarations define the
interface; no additional TSX prop is required:

```tsx
circuit.add(
  <subcircuit name="FILTER" exposedNets={["GND"]}>
    <port name="IN" direction="left" connectsTo="R1.pin1" />
    <port name="OUT" direction="right" connectsTo="R1.pin2" />
    <resistor name="R1" resistance="1k" schX={-1} />
    <capacitor name="C1" capacitance="100nF" schX={1}
      connections={{ pin1: "R1.pin2", pin2: "net.GND" }} />
  </subcircuit>,
)
```

Direct `<port>` children are public interface terminals. `exposedNets` adds
public ports connected to the named local nets; `exposeNets` includes all local
nets. The `net.` prefix is accepted, duplicate exposed names are deduplicated,
and an explicit same-named port takes precedence. These remain the same source
ports and nets used by electrical connectivity, rather than synthetic components.

Core places terminals after internal schematic layout and before trace routing.
`schPinArrangement` supplies side/order; otherwise each port's `direction`
selects a side, defaulting to left. The boundary encloses component bodies, text,
and terminals with padding. `schWidth` and `schHeight` provide minimum dimensions.
Directions describe visual placement, not electrical input/output direction.

Circuit JSON records the frame on `schematic_group` with `show_boundary: true`.
Public `schematic_port` records have group ownership and `boundary_position`
instead of component ownership. `center` is the terminal outside the frame.
Coordinates include translation and use schematic-world mm (+X right, +Y up).
The trace solver approaches the public terminals from inside the frame.

This initial implementation supports one standalone root subcircuit on a single
schematic sheet. A root spanning multiple sheet coordinate frames does not get
an automatic boundary. Board-nested subcircuits retain their current behavior;
`showAsSchematicBox` continues to produce a collapsed symbol. Arbitrary drawing
primitives and manual public-port coordinates are not boundary-layout inputs.

Companion schema: https://github.com/tscircuit/circuit-json/pull/1004.
Converter companion: https://github.com/tscircuit/circuit-to-svg/pull/932.
It renders the explicit frame and terminal geometry; it
does not infer the interface. Update the schema and converter dependencies to
their published versions before merging. The regression snapshots were rendered
with both companion branches linked locally.

`tests/subcircuits/root-subcircuit-bq24074.test.tsx` provides a TI BQ24074 charger
example with ten exported ports, three capacitors, and three configuration
resistors. It is an interface-rendering fixture, not a validated charger design.
