import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<switch /> propagates supplierPartNumbers and manufacturerPartNumber to source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <switch
        name="SW1"
        type="spdt"
        supplierPartNumbers={{ jlcpcb: ["C2681570"] }}
        manufacturerPartNumber="SS-12D00G3"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "SW1",
  })

  expect(sourceComponent?.supplier_part_numbers).toEqual({
    jlcpcb: ["C2681570"],
  })
  expect(sourceComponent?.manufacturer_part_number).toBe("SS-12D00G3")
})
