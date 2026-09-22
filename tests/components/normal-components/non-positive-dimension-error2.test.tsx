import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a zero-size board is reported", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="0mm" height="0mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((e: any) => e.type === "pcb_placement_error") as any[]

  expect(errors.length).toBe(2)
  const messages = errors.map((e) => e.message).join("\n")
  expect(messages).toContain("pcb_board")
  expect(messages).toContain("width=0mm")
  expect(messages).toContain("height=0mm")
})
