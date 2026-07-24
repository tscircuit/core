import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol maps diode symbol ports to a chip for traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm">
      <schematicsheet name="Diode" displayName="Diode" sheetIndex={0} />
      <schematicsymbol
        name="A"
        chipRef=".D1"
        symbolName="diode_right"
        connections={{
          pin1: "D1.A",
          pin2: "D1.K",
        }}
        schSheetName="Diode"
        schX={0}
        schY={0}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        connections={{ pin2: "D1.A" }}
        pcbX={-3}
        schSheetName="Diode"
        schX={-2}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: "D1.K" }}
        pcbX={3}
        schSheetName="Diode"
        schX={2}
      />

      <chip
        name="D1"
        footprint="0402"
        noSchematicRepresentation
        pcbX={0}
        pinLabels={{
          pin1: "A",
          pin2: "K",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
