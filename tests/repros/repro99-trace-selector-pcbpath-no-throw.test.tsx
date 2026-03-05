import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro100 trace selector with pcbPath inserts error instead of throwing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <group name="J1" pcbX={2} pcbY={0} />
      <trace from="R1.pin1" to="J1.pin1" pcbPath={["R1.pin1", "J1.pin1"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((c) => c.type === "source_trace_not_connected_error")

  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain('selector "J1.pin1"')
  expect(errors[0].message).toContain("It has no ports")
})
