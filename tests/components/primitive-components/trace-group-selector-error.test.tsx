import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("selecting a pin on a group explains that groups have no pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <group name="G1">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={3} />
      </group>
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={8} />
      <trace from=".G1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const error = circuit
    .getCircuitJson()
    .find((e: any) => String(e.type).includes("error")) as any

  expect(error).toBeDefined()

  // On main, ".G1 >" resolves to the group's first child, so the message
  // names R1 (which does have pin1) instead of the group. After stripping
  // the combinator, the target is the group and the message should say so.
  expect(error.message).toContain('Component "G1" found')
  expect(error.message).not.toContain("It has no ports")
  expect(error.message).toContain("It is a group")
  expect(error.message).toContain(".R1")
  expect(error.message).toContain(".C1")
  expect(error.message).toContain('".R1 > .pin1"')
})

test("a chip with a missing pin still lists pins, not the group wording", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={0} />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <trace from=".R1 > .pin1" to=".U1 > .NOPE" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const error = circuit
    .getCircuitJson()
    .find((e: any) => String(e.type).includes("error")) as any

  expect(error).toBeDefined()
  expect(error.message).not.toContain("It is a group")
  expect(error.message).toContain("pins")
})
