// Regression test for manufacturerPartNumber/supplierPartNumbers propagation.
// This is a data-propagation test, so it verifies the generated source_component
// rather than rendered output. Same pattern as the <switch /> fix in PR #2765.
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<mosfet /> propagates supplierPartNumbers and manufacturerPartNumber to source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <mosfet
        name="Q1"
        channelType="n"
        mosfetMode="enhancement"
        footprint="to220_3"
        manufacturerPartNumber="IRF520N"
        supplierPartNumbers={{ jlcpcb: ["C2681570"] }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "Q1",
  })

  expect(sourceComponent?.supplier_part_numbers).toEqual({
    jlcpcb: ["C2681570"],
  })
  expect(sourceComponent?.manufacturer_part_number).toBe("IRF520N")
})
