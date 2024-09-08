import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Trace with tracehint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <trace>
        <tracehint
          pcbPortId="port1"
          pcbComponentId="component1"
          route={[
            { x: 0, y: 0 },
            { x: 5, y: 5 },
          ]}
        />
      </trace>
    </board>
  )

  circuit.render()

  const pcbTraceHints = circuit.db.pcb_trace_hint.list()
  expect(pcbTraceHints).toHaveLength(1)
  expect(pcbTraceHints[0]).toMatchObject({
    type: "pcb_trace_hint",
    pcb_port_id: "port1",
    pcb_component_id: "component1",
    route: [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ],
  })
})
