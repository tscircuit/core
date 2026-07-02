import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * REPRO of https://github.com/tscircuit/tscircuit.com/issues/3759
 * "Floating power net label"
 *
 * A power net label (`<netlabel net="V5" connection="net.C" />`) attached to a
 * net that only reaches R3.pin1 rendered a phantom V5 rail on top of R1.
 *
 * Root cause: NetLabel._getConnectedPorts() resolved the `connection` selector
 * with selectOne("net.C") and treated the returned Net instance as a Port. A
 * Net has no schematic port position, so the user's label anchored at the
 * fallback (0,0) - exactly where R1 sits. The schematic trace solver then
 * placed its own V5 rail at R3.pin1 (it couldn't see the user label owned that
 * port), routed a stub trace to the pin, and the port was marked connected -
 * so insertNetLabelsForPortsMissingTrace never rescued the stranded user
 * label. Non-power labels were rescued by that pass, which is why the bug only
 * showed up for power/ground rails.
 *
 * The fix resolves net connections to the net's actual connected ports, so the
 * user label anchors at R3.pin1 and the solver skips its duplicate placement.
 */
test("repro142: power net label connected via net anchors at the net's port instead of floating over another component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        connections={{ pin1: "net.A", pin2: "net.CENTER" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        connections={{ pin1: "net.B", pin2: "net.CENTER" }}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0603"
        connections={{ pin1: "net.C", pin2: "net.CENTER" }}
      />
      <netlabel net="V5" connection="net.C" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { db } = circuit

  const v5Labels = db.schematic_net_label
    .list()
    .filter((label) => label.text === "V5")
  expect(v5Labels.length).toBeGreaterThan(0)

  const r3 = db.source_component.getWhere({ name: "R3" })!
  const r3Pin1SourcePort = db.source_port.getWhere({
    source_component_id: r3.source_component_id,
    name: "pin1",
  })!
  const r3Pin1SchematicPort = db.schematic_port.getWhere({
    source_port_id: r3Pin1SourcePort.source_port_id,
  })!

  // Every V5 label must stay near R3.pin1, the only port on net.C. Before the
  // fix a phantom V5 label anchored at (0,0), directly on top of R1.
  for (const label of v5Labels) {
    const dx = label.anchor_position!.x - r3Pin1SchematicPort.center.x
    const dy = label.anchor_position!.y - r3Pin1SchematicPort.center.y
    expect(Math.sqrt(dx * dx + dy * dy)).toBeLessThan(1)
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
