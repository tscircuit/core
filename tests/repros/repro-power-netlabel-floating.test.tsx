import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("power netlabel connects to specified net connection instead of floating at origin", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schX={0}
        schY={0}
        connections={{ pin1: "net.A", pin2: "net.CENTER" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        schX={5}
        schY={5}
        connections={{ pin1: "net.B", pin2: "net.CENTER" }}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0603"
        schX={10}
        schY={10}
        connections={{ pin1: "net.C", pin2: "net.CENTER" }}
      />
      <netlabel net="V5" connection="net.C" />
    </board>,
  )
  circuit.render()

  const netLabels = circuit.db.schematic_net_label
    .list()
    .filter((nl) => nl.text === "V5")
  const r3Pin1Port = circuit.db.schematic_port.list().find((sp) => {
    const srcPort = circuit.db.source_port.get(sp.source_port_id!)
    const srcComp = srcPort
      ? circuit.db.source_component.get(srcPort.source_component_id!)
      : null
    return srcComp?.name === "R3" && srcPort?.name === "pin1"
  })

  // Ensure only ONE V5 power label exists (no floating duplicates)
  expect(netLabels.length).toBe(1)
  const netLabel = netLabels[0]

  expect(netLabel).toBeDefined()
  expect(r3Pin1Port).toBeDefined()
  // Ensure the power label anchor is at R3's pin position (not floating at origin 0,0)
  expect(Math.abs(netLabel.anchor_position.x - r3Pin1Port!.center.x)).toBeLessThan(0.5)
  expect(Math.abs(netLabel.anchor_position.y - r3Pin1Port!.center.y)).toBeLessThan(0.5)
})
