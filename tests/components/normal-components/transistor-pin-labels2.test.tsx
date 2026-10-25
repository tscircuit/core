import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("connects transistor pinLabels to the matching SOT-23 pads", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <transistor
        name="Q1"
        type="npn"
        footprint="sot23"
        pinLabels={{ pin1: "base", pin2: "emitter", pin3: "collector" }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <trace from=".R1 > .pin2" to=".Q1 > .base" />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  const trace = circuit.db.source_trace.list()[0]!
  const basePort = circuit.db.source_port.list().find((p) => p.name === "base")!
  expect(trace.connected_source_port_ids).toContain(basePort.source_port_id)
  expect(basePort.pin_number).toBe(1)
})
