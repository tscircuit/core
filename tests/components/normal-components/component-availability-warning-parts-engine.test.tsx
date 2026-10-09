import { expect, test } from "bun:test"
import { supplierProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const supplierNames =
  supplierProps.shape.supplierPartNumbers.unwrap().keySchema.options
const automaticPartNumbers = Object.fromEntries(
  supplierNames.map((supplierName) => [supplierName, ["AUTOMATIC-PART"]]),
)

test("availability skips automatically selected suppliers and only warns for explicit supplier part numbers", async () => {
  for (const supplierName of supplierNames) {
    let finishSelection!: () => void
    const selection = new Promise<void>((resolve) => {
      finishSelection = resolve
    })
    const calls: string[] = []
    const { circuit } = getTestFixture({
      platform: { checkAvailability: true },
    })
    circuit.add(
      <board
        routingDisabled
        partsEngine={{
          findPart: async () => {
            await selection
            return automaticPartNumbers
          },
          fetchPartAvailability: async ({
            supplierName,
            supplierPartNumber,
          }) => {
            calls.push(`${supplierName}:${supplierPartNumber}`)
            throw new Error("Service unavailable")
          },
        }}
      >
        <resistor name="R1" resistance="1k" footprint="0402" />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          supplierPartNumbers={{ [supplierName]: ["EXPLICIT-PART"] }}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          supplierPartNumbers={{ [supplierName]: [] }}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          supplierPartNumbers={{ [supplierName]: [" "] }}
        />
      </board>,
    )
    circuit.render()
    finishSelection()
    await circuit.renderUntilSettled()
    expect(calls).toEqual([`${supplierName}:EXPLICIT-PART`])
    const warnings = circuit.db.source_component_availability_warning.list()
    expect(warnings).toHaveLength(1)
    expect(warnings[0].supplier_name).toBe(supplierName)
    expect(warnings[0].supplier_part_numbers).toEqual(["EXPLICIT-PART"])
    expect(warnings[0].message).toBe(
      `R2 may not have availability from ${supplierName} (EXPLICIT-PART).`,
    )
    expect(
      circuit.db.source_component.list().find(({ name }) => name === "R1")
        ?.supplier_part_numbers,
    ).toEqual(automaticPartNumbers)
    expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(0)
  }
})
