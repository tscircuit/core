import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("missing-pin error names the component and lists its pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pinLabels={{ pin1: ["VCC"], pin2: ["GND"] }}
      />
      <trace from=".U1 > .VCC" to=".U1 > .NOPE" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const error = circuit
    .getCircuitJson()
    .find((e: any) => String(e.type).includes("error")) as any

  expect(error).toBeDefined()

  // The parent selector used to keep the child combinator (".U1 > "), which
  // selects an arbitrary descendant rather than the chip — so the message
  // named the wrong element and claimed it had no ports.
  expect(error.message).toContain('Component "U1" found')
  expect(error.message).not.toContain('".U1 > "')
  expect(error.message).not.toContain("It has no ports")
  // The pin list must come from the chip itself.
  expect(error.message).toContain("VCC")
  expect(error.message).toContain("GND")
})

test("missing-component error reports the component selector without the combinator", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
      <trace from=".R1 > .pin1" to=".R9 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const error = circuit
    .getCircuitJson()
    .find((e: any) => String(e.type).includes("error")) as any

  expect(error).toBeDefined()
  expect(error.message).toContain('Component ".R9" not found')
  expect(error.message).not.toContain('".R9 > "')
})
