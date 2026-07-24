import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// manufacturerPartNumber was silently dropped from source_component.
// The bug is non-visual; snapshots provide rendering protection.
test("<resonator /> propagates manufacturerPartNumber to source_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resonator
        name="K1"
        frequency="16MHz"
        loadCapacitance="22pF"
        manufacturerPartNumber="CSTCE16M0V53-R0"
        footprint="hc49"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "K1",
  })

  expect(sourceComponent?.manufacturer_part_number).toBe("CSTCE16M0V53-R0")
})
