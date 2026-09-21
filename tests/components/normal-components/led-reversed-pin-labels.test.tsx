import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("LED schematic polarity follows pin labels rather than footprint numbering", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} routingDisabled>
      <resistor
        name="R_PWR_LED"
        resistance="330"
        footprint="0402"
        schX={0}
        schY={3}
        schRotation={270}
        pcbX={-4}
      />
      <led
        name="D_PWR"
        color="green"
        footprint="res_p1.498mm_pw0.8mm_ph0.8mm"
        pinLabels={{ pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }}
        schRotation={90}
      />
      <trace from="net.V3V3" to=".R_PWR_LED > .pin1" />
      <trace from=".R_PWR_LED > .pin2" to=".D_PWR > .anode" />
      <trace from=".D_PWR > .cathode" to="net.GND" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const led = circuit.db.source_component
    .list()
    .find((c) => c.name === "D_PWR")!
  const ports = circuit.db.source_port
    .list()
    .filter((p) => p.source_component_id === led.source_component_id)
  const anode = ports.find((p) => p.name === "anode")!
  const cathode = ports.find((p) => p.name === "cathode")!
  expect(anode.pin_number).toBe(2)
  expect(cathode.pin_number).toBe(1)
  const schematicAnode = circuit.db.schematic_port
    .list()
    .find((p) => p.source_port_id === anode.source_port_id)!
  const schematicCathode = circuit.db.schematic_port
    .list()
    .find((p) => p.source_port_id === cathode.source_port_id)!
  // At schRotation=90 the LED points up: its drawn cathode is above its anode.
  expect(schematicCathode.center.y).toBeGreaterThan(schematicAnode.center.y)
  for (const port of [anode, cathode]) {
    const pcbPort = circuit.db.pcb_port
      .list()
      .find((p) => p.source_port_id === port.source_port_id)!
    const pad = circuit.db.pcb_smtpad
      .list()
      .find((p) => p.pcb_port_id === pcbPort.pcb_port_id)!
    expect(pad.port_hints).toContain(String(port.pin_number))
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
