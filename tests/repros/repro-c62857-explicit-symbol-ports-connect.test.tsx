import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { A_6124B104K500NT } from "./repro-c62857-explicit-symbol-ports-connect/A_6124B104K500NT"

test("two imported C62857 symbols connect through their explicit ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm">
      <A_6124B104K500NT name="C1" schX={-1.5} schY={0} pcbX={-2.5} />
      <A_6124B104K500NT name="C2" schX={1.5} schY={0} pcbX={2.5} />
      <trace from=".C1 > .pin8" to=".C2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const c1 = circuit.db.source_component.getWhere({ name: "C1" })!
  const c2 = circuit.db.source_component.getWhere({ name: "C2" })!
  const c1Pin8 = circuit.db.source_port.getWhere({
    source_component_id: c1.source_component_id,
    name: "pin8",
  })!
  const c2Pin1 = circuit.db.source_port.getWhere({
    source_component_id: c2.source_component_id,
    name: "pin1",
  })!
  const sourceTrace = circuit.db.source_trace
    .list()
    .find(
      (trace) =>
        trace.connected_source_port_ids.includes(c1Pin8.source_port_id) &&
        trace.connected_source_port_ids.includes(c2Pin1.source_port_id),
    )

  expect(sourceTrace).toBeDefined()
  expect(circuit.db.source_port.list()).toHaveLength(16)
  expect(circuit.db.schematic_port.list()).toHaveLength(16)
  expect(circuit.db.schematic_trace.list()).toHaveLength(1)
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
    css: ".sch-port-label, .sch-pin-label { display: none; }",
  })
})
