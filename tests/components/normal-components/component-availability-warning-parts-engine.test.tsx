import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("availability skips automatically selected JLCPCB parts and treats explicit lookup failures as advisory", async () => {
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
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C1"] }}
      />
    </board>,
  )
  circuit.render()
  finishSelection()
  await circuit.renderUntilSettled()
  expect(calls).toBe(1)
  const warnings = circuit.db.source_component_availability_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toBe(
    "R2 may not have availability from JLCPCB (C1).",
  )
  expect(
    circuit.db.source_component.list().find(({ name }) => name === "R1")
      ?.supplier_part_numbers,
  ).toEqual({ jlcpcb: ["C1525"] })
  expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(0)
})
