import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton side1 and side2 aliases resolve for two-terminal and internally connected switches", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        connections={{ side1: "net.LEFT", side2: "net.RIGHT" }}
      />
      <pushbutton
        name="SW2"
        footprint="pushbutton_id1.3mm_od2mm"
        internallyConnectedPins={[
          ["pin1", "pin2"],
          ["pin3", "pin4"],
        ]}
        connections={{ side1: "net.FIRST", side2: "net.SECOND" }}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.selectOne(".SW1 .side1")).toBe(circuit.selectOne(".SW1 .pin1"))
  expect(circuit.selectOne(".SW1 .side2")).toBe(circuit.selectOne(".SW1 .pin2"))
  expect(circuit.selectOne(".SW2 .side1")).toBe(circuit.selectOne(".SW2 .pin1"))
  expect(circuit.selectOne(".SW2 .side2")).toBe(circuit.selectOne(".SW2 .pin3"))
  expect(circuit.db.source_trace.list()).toHaveLength(4)
})
