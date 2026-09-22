import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pin-not-found error names the component and lists its pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: ["VCC"], pin2: ["GND"] }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" />
      <trace from=".R1 > .pin1" to=".U1 > .NOPE" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((e: any) => e.type === "source_trace_not_connected_error") as any[]

  expect(errors.length).toBe(1)
  const message: string = errors[0].message
  expect(message).toContain('.U1 > .NOPE"')
  expect(message).toContain('Component "U1" found')
  expect(message).toContain('does not have pin "NOPE"')
  expect(message).not.toContain("It has no ports")
  expect(message).toContain("VCC")
})
