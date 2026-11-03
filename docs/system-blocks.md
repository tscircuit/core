# System block diagrams

Import `systemblock` from `@tscircuit/core` to describe a system overview in TSX.
Pages work independently or alongside physical components in a board/subcircuit.
Core emits resolved `system_block_*` Circuit JSON records for SVG viewers.

```tsx
import { Circuit, systemblock } from "@tscircuit/core"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"

const circuit = new Circuit()
circuit.add(
  <systemblock.page name="overview" displayName="Wireless sensor node">
    <systemblock.group name="processing" displayName="Sensing and processing">
      <systemblock.component name="sensor" displayName="Environment sensor"
        description="Measures temperature and humidity" />
      <systemblock.component name="mcu" displayName="Microcontroller"
        description="Processes readings" />
    </systemblock.group>
    <systemblock.component name="radio" displayName="Radio module"
      description="Transmits measurements" />
    <systemblock.connection from="sensor" to="mcu" label="I2C" direction="both" />
    <systemblock.connection from="mcu" to="radio" label="SPI" direction="both" />
  </systemblock.page>,
)
await circuit.renderUntilSettled()
const svg = convertCircuitJsonToSystemSvg(circuit.getCircuitJson())
```

![Nested TSX example](../tests/features/system-blocks/__snapshots__/system-blocks-nested.snap.svg)

## Layout and connections

Core uses [Dagre](https://github.com/dagrejs/dagre) for synchronous directed graph
layout, compound groups, edge routes, and label placement. It has no browser or
DOM requirement. The 2.x dependency line supports the nested-group and self-loop
fixtures in this package. Block dimensions are derived from their text; groups
and pages are sized to contain their contents with heading space and margins.

Page `direction` is `right` (default), `left`, `down`, or `up`. Geometry is in
diagram millimeters, centered on the page with +X right and +Y up. Nested group
centers and route points are absolute page coordinates. PCB positions and sizes
do not affect the system layout. The SVG renderer receives resolved geometry;
no additional graph layout is necessary.

Connections use component names in `from` and `to`. Their `direction` is
`forward` (default), `both`, or `none`. Parallel connections, feedback cycles,
self-loops, and disconnected blocks are supported. The props API's `kind`
(`signal` by default or `power`) becomes the required `is_signal` and `is_power`
booleans in Circuit JSON. Every supplied label has a resolved
`label_anchor_center`. Connections do not create electrical traces or nets.

![Power and feedback TSX example](../tests/features/system-blocks/__snapshots__/system-blocks-power-feedback.snap.svg)

## Names, grouping, and PCB associations

Page names must be unique within the circuit. Block and group names share one
namespace per page, including nested groups. Connection names are optional and
unique among named connections in a page. Nested pages and non-system children
inside a page/group are invalid. Groups can contain connections as well as
components and other groups.

Components and groups accept optional `pcbComponentName`, `pcbComponentNames`,
and `pcbSubcircuitName` props. For example, inside a board:

```tsx
<systemblock.page name="power-overview">
  <systemblock.group name="power" displayName="Power supply"
    pcbSubcircuitName="power">
    <systemblock.component name="filter" displayName="Supply filtering"
      pcbComponentNames={["R1", "C1"]} pcbSubcircuitName="power" />
  </systemblock.group>
</systemblock.page>
```

Component names are literal reference designators, resolved in the page's
owning subcircuit unless `pcbSubcircuitName` selects another named subcircuit.
Singular and plural component props are mutually exclusive; repeated names in
the plural form resolve to a union. `pcbSubcircuitName` alone associates the
whole PCB group. Parent group associations are not inherited by child blocks.
Missing or ambiguous PCB targets throw readable errors. Referenced PCB output
must exist, so these associations require PCB rendering to be enabled.

The records carry resolved `pcb_component_ids` and/or `pcb_group_id` for viewer
navigation. System names are independent of physical component names.

## Examples and validation

The [TSX fixtures](../tests/features/system-blocks/) include all four directions,
nested groups, power fanout, feedback, PCB references, multiple pages, empty
groups/pages, long text, and page updates. Snapshots use `circuit-to-svg` 0.0.455
or later. Tests also validate the emitted Circuit JSON and check that routes
terminate on block boundaries and stay within the resolved page bounds.
