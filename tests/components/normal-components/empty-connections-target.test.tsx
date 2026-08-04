import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty connections target reports an error instead of crashing the render", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        connections={{ pin1: "", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_invalid_component_property_error
    .list()
    .filter((e) => e.property_name === "connections")

  // NOTE: the component id in getString() comes from a process-global counter
  // (see tscircuit/core#2848), so assert on the message content rather than
  // snapshotting it.
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain('name=".C1"')
  expect(errors[0].message).toContain(
    'has an empty connections target for pin "pin1"',
  )
  expect(errors[0].message).toContain(
    'Provide a selector such as ".R1 > .pin1" or "net.VCC", or remove the entry.',
  )

  // the rest of the board still renders
  expect(circuit.db.source_component.list().map((c) => c.name)).toEqual([
    "R1",
    "C1",
  ])

  // the sibling valid connection still produces its trace
  expect(circuit.db.source_trace.list()).toHaveLength(1)
})

test("whitespace-only connections target is treated as empty", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        connections={{ pin1: "   " }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_invalid_component_property_error
    .list()
    .filter((e) => e.property_name === "connections")

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain('empty connections target for pin "pin1"')
})

test("an empty entry in an array connections target is reported", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        connections={{ pin1: [".R1 > .pin1", ""] }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_invalid_component_property_error
    .list()
    .filter((e) => e.property_name === "connections")

  expect(errors).toHaveLength(1)
  // the valid entry in the same array still connects
  expect(circuit.db.source_trace.list()).toHaveLength(1)
})

test("valid connections are unaffected", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        connections={{ pin1: ".R1 > .pin2", pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_invalid_component_property_error
      .list()
      .filter((e) => e.property_name === "connections"),
  ).toHaveLength(0)
  expect(circuit.db.source_trace.list()).toHaveLength(2)
})
