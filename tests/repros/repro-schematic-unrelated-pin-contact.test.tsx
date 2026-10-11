import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("supply wires avoid grounded pins", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <schematictext
        text="PASS: core supply wires avoid grounded pins"
        schX={0.7}
        schY={1.2}
        fontSize={0.12}
      />
      <net name="SUPPLY" isPowerNet />
      <capacitor
        name="C1"
        capacitance="100nF"
        schX={0}
        schY={0}
        connections={{ pin1: "net.SUPPLY", pin2: "net.GND" }}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        schX={1.4}
        schY={0}
        connections={{ pin1: "net.SUPPLY", pin2: "net.GND" }}
      />
      <chip
        name="U1"
        schX={1.6}
        schY={-1}
        schWidth={0.2}
        schHeight={0.2}
        pinLabels={{ pin1: "VCC" }}
        connections={{ pin1: "net.SUPPLY" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const capacitor = circuit.db.source_component.getWhere({ name: "C1" })!
  const groundPort = circuit.db.source_port.getWhere({
    source_component_id: capacitor.source_component_id,
    pin_number: 2,
  })!
  const groundPin = circuit.db.schematic_port.getWhere({
    source_port_id: groundPort.source_port_id,
  })!.center
  const supply = circuit.db.source_net.getWhere({ name: "SUPPLY" })!
  const supplyEdges = circuit.db.schematic_trace
    .list()
    .filter(
      (trace) =>
        trace.subcircuit_connectivity_map_key ===
        supply.subcircuit_connectivity_map_key,
    )
    .flatMap((trace) => trace.edges)
  expect(supplyEdges.length).toBeGreaterThan(0)
  expect(
    supplyEdges.some(
      ({ from, to }) =>
        (Math.abs(from.y - groundPin.y) < 1e-6 &&
          Math.abs(to.y - groundPin.y) < 1e-6 &&
          groundPin.x >= Math.min(from.x, to.x) &&
          groundPin.x <= Math.max(from.x, to.x)) ||
        (Math.abs(from.x - groundPin.x) < 1e-6 &&
          Math.abs(to.x - groundPin.x) < 1e-6 &&
          groundPin.y >= Math.min(from.y, to.y) &&
          groundPin.y <= Math.max(from.y, to.y)),
    ),
  ).toBe(false)
  expect(
    circuit.db.schematic_port.list().every((port) => port.is_connected),
  ).toBe(true)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    colorOverrides: { schematic: { background: "white" } },
    width: 800,
    height: 500,
  })
})
