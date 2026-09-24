import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace selector pointing at a group names its children (#2852)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="1uF" footprint="0402" />
      </group>
      <resistor name="R2" resistance="1k" footprint="0402" />
      <trace from=".G1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((c: any) => c.type === "source_trace_not_connected_error")

  expect(errors.length).toBe(1)
  const message = (errors[0] as any).message
  // The error must name the group — not its first child — and guide the
  // user to a component inside it.
  expect(message).toContain('Component "G1" found')
  expect(message).toContain("It is a group")
  expect(message).toContain('".R1 > .pin1"')
  expect(message).toContain("[.R1, .C1]")
})
