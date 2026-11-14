# Standalone subcircuit schematic interfaces

Render a `<subcircuit>` as the sole root element to show its internal schematic
inside a boundary with its public terminals. Existing declarations define the
interface; no additional TSX prop is required:

The integration fixture adapts the actual
[CC2340R5 reference design](https://tscircuit.com/ShiboSoftwareDev/cc2340r5-reference-design/customize?package_release_id=bff7bbb1-c0df-4b3e-8cb2-5f5c706caa87&preview_file=dist%2Findex%2Fcircuit.json#schematic).
It preserves all 27 components and 16 nets, including the regulator, decoupling,
crystals, RF matching/antenna, reset, and SWD circuit. The added module interface
exports `VDDS`, `GND`, `RESET_N`, `SWDIO`, `SWCLK`, and eight GPIOs that the
published board marks unconnected. The adaptation adds eight GPIO nets and
removes their NC declarations, giving 13 public terminals and 24 total nets.

```tsx
import Cc2340Reference from "./tests/fixtures/cc2340r5-reference"

// The fixture uses real reference-design contents in a root <subcircuit>.
// "nets" declares exposedNets; "ports" uses direct <port connectsTo="U1.pin…">.
circuit.add(<Cc2340Reference interfaceMode="nets" />)
```

The wrapper uses `schPinArrangement` to align all 13 terminals on the left
with their actual MCU pins. The package originally publishes a
board; these exports are the proposed module adaptation. Provenance and the
exact changes are recorded in the fixture's README.

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
Core aligns terminal positions with connected internal pins when space permits,
while retaining the declared side and order. The trace solver approaches public
terminals from inside the frame through explicit connections to internal pins.
These attachments bypass inter-section label splitting and retain their actual
source trace IDs. Routing still respects the configured trace distance limit.

This initial implementation supports one standalone root subcircuit on a single
schematic sheet. A root spanning multiple sheet coordinate frames does not get
an automatic boundary. Board-nested subcircuits retain their current behavior;
`showAsSchematicBox` continues to produce a collapsed symbol. Arbitrary drawing
primitives and manual public-port coordinates are not boundary-layout inputs.

Companion schema: https://github.com/tscircuit/circuit-json/pull/1004.
Converter companion: https://github.com/tscircuit/circuit-to-svg/pull/932.
The converter renders the explicit frame and terminal geometry; it does not
infer the interface. Both companions are merged. The regression snapshots are
verified against the published `circuit-json@0.0.550` and
`circuit-to-svg@0.0.460` packages.

`tests/subcircuits/root-subcircuit-cc2340r5.test.tsx` verifies the real reference
against the published circuit JSON's electrical signature plus the explicit
eight-net GPIO adaptation. Wire-edge traversal checks every exported terminal's
physical route to its MCU pin in both direct-port and exposed-net modes. Related tests cover
exposed nets, translated placement, nested use, and the collapsed representation.
Schematic sections remain active when the reference is rendered without a board,
so inter-section connections keep their net-label representation.
