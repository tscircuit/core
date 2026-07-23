import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verifies manufacturerPartNumber/supplierPartNumbers propagation.
// This is a data-propagation check that verifies the generated source_component
// rather than rendered output. Same pattern as the <switch /> fix in PR #2765.
test("<inductor /> manufacturerPartNumber propagation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <inductor
        name="L1"
        inductance="10"
        footprint="axial_p0.3in"
        manufacturerPartNumber="SRP1234"
        supplierPartNumbers={{ jlcpcb: ["C12345"] }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "L1",
  })

  expect(sourceComponent?.manufacturer_part_number).toBe("SRP1234")
  expect(sourceComponent?.supplier_part_numbers).toEqual({
    jlcpcb: ["C12345"],
  })
})
