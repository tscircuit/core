import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an empty connections target is reported instead of throwing a css parser error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={0}
        connections={{ pin1: "", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_component_misconfigured_error.list()
  expect(errors.length).toBe(1)
  expect(errors[0].message).toContain("empty connections target")
  expect(errors[0].message).toContain("pin1")

  // The sibling, valid connection is still honoured.
  expect(circuit.db.source_trace.list().length).toBe(1)
})

test("a whitespace-only connections target is reported too", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={0}
        connections={{ pin1: "   " }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component_misconfigured_error.list().length).toBe(1)
})

test("fully valid connections raise nothing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={0}
        connections={{ pin1: ".R1 > .pin2", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component_misconfigured_error.list()).toEqual([])
  expect(circuit.db.source_trace.list().length).toBe(2)
})
