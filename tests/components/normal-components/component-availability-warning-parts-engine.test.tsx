import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("availability waits for async parts selection and treats failed engine lookups as advisory", async () => {
  let finishSelection!: () => void
  const selection = new Promise<void>((resolve) => {
    finishSelection = resolve
  })
  let calls = 0
  const { circuit } = getTestFixture({ platform: { checkAvailability: true } })
  circuit.add(
    <board
      routingDisabled
      partsEngine={{
        findPart: async () => {
          await selection
          return { jlcpcb: ["C1525"] }
        },
        fetchPartAvailability: async () => {
          calls++
          throw new Error("Service unavailable")
        },
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  circuit.render()
  expect(calls).toBe(0)
  finishSelection()
  await circuit.renderUntilSettled()
  expect(calls).toBe(1)
  const warnings = circuit.db.source_component_availability_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toBe(
    "R1 may not have availability from JLCPCB (C1525).",
  )
  expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(0)
})
