import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group ports select a physical target from multi-target connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <subcircuit
        name="FILTER"
        showAsSchematicBox
        connections={{ OUT: ["net.SIGNAL", "R1.pin1"] }}
      >
        <port name="OUT" direction="left" />
        <resistor name="R1" resistance="10k" footprint="0402" />
      </subcircuit>
      <resistor name="R2" resistance="10k" footprint="0402" />
      <trace from="FILTER.OUT" to="R2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const outSourcePort = circuit.db.source_port
    .list()
    .find((port) => port.name === "OUT" && !port.source_component_id)!
  const r1SourceComponent = circuit.db.source_component.getWhere({
    name: "R1",
  })!
  const r1Pin1SourcePort = circuit.db.source_port
    .list({ source_component_id: r1SourceComponent.source_component_id })
    .find((port) => port.name === "pin1")!
  const outPcbPort = circuit.db.pcb_port.getWhere({
    source_port_id: outSourcePort.source_port_id,
  })!
  const r1Pin1PcbPort = circuit.db.pcb_port.getWhere({
    source_port_id: r1Pin1SourcePort.source_port_id,
  })!

  expect({
    x: outPcbPort.x,
    y: outPcbPort.y,
    layers: outPcbPort.layers,
  }).toEqual({
    x: r1Pin1PcbPort.x,
    y: r1Pin1PcbPort.y,
    layers: r1Pin1PcbPort.layers,
  })
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
