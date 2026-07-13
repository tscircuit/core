import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group port connectsTo creates source connectivity regardless of child order", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <pcbnotetext
        text="port.connectsTo: FILTER.VOUT to R1.pin2"
        pcbX={0}
        pcbY={-4}
      />
      <group name="FILTER" showAsSchematicBox schTitle="RC Filter" pcbX={-4}>
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
    </board>,
  )

  await circuit.renderUntilSettled()

  const r1 = circuit.db.source_component.getWhere({ name: "R1" })!
  const r1Pin1 = circuit.db.source_port.getWhere({
    source_component_id: r1.source_component_id,
    name: "pin1",
  })!
  const r1Pin2 = circuit.db.source_port.getWhere({
    source_component_id: r1.source_component_id,
    name: "pin2",
  })!
  const vin = circuit.db.source_port.getWhere({
    source_component_id: null as any,
    name: "VIN",
  })!
  const vout = circuit.db.source_port.getWhere({
    source_component_id: null as any,
    name: "VOUT",
  })!

  const sourceTraces = circuit.db.source_trace.list()
  const hasSourceTraceBetween = (portA: string, portB: string) =>
    sourceTraces.some(
      (trace) =>
        trace.connected_source_port_ids.includes(portA) &&
        trace.connected_source_port_ids.includes(portB),
    )

  expect(hasSourceTraceBetween(vin.source_port_id, r1Pin1.source_port_id)).toBe(
    true,
  )
  expect(
    hasSourceTraceBetween(vout.source_port_id, r1Pin2.source_port_id),
  ).toBe(true)
  expect(
    circuit.db.pcb_port.getWhere({ source_port_id: vin.source_port_id }),
  ).toBeDefined()
  expect(
    circuit.db.pcb_port.getWhere({ source_port_id: vout.source_port_id }),
  ).toBeDefined()
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
