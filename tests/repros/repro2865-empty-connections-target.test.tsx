import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("empty string in connections records source_component_misconfigured_error and renders sibling connections", async () => {
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

  const misconfiguredErrors =
    circuit.db.source_component_misconfigured_error.list()

  expect(misconfiguredErrors).toHaveLength(1)
  expect(misconfiguredErrors[0]?.message).toContain(
    'has an empty connections target for pin "pin1". Provide a selector such as ".R1 > .pin1" or "net.VCC", or remove the entry.',
  )
  expect(misconfiguredErrors[0]?.source_component_ids.length).toBeGreaterThan(0)

  const traces = circuit.db.source_trace.list()
  expect(traces).toHaveLength(1)
})

test("array of connections with whitespace and empty targets records misconfigured errors without crashing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <capacitor
        name="C2"
        capacitance="1uF"
        footprint="0402"
        connections={{ pin1: ["", "   "], pin2: ".R1 > .pin1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const misconfiguredErrors =
    circuit.db.source_component_misconfigured_error.list()

  expect(misconfiguredErrors).toHaveLength(2)
  for (const err of misconfiguredErrors) {
    expect(err.message).toContain(
      'has an empty connections target for pin "pin1"',
    )
    expect(err.source_component_ids.length).toBeGreaterThan(0)
  }

  const traces = circuit.db.source_trace.list()
  expect(traces).toHaveLength(1)
})
