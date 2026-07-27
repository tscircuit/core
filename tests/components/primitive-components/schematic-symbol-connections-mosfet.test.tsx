import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol maps MOSFET symbol ports to a chip for traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <schematicsheet name="MOSFET A" displayName="MOSFET A" sheetIndex={0} />
      <schematicsymbol
        name="A"
        displayName="Q1A"
        chipRef=".Q1"
        symbolName="n_channel_e_mosfet_transistor_horz"
        connections={{
          gate: "Q1.G1",
          source: "Q1.S1",
          drain: "Q1.D1",
        }}
        schSheetName="MOSFET A"
        schX={0}
        schY={0}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={1}
        schSheetName="MOSFET A"
        schX={-2}
        schY={-0.1}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={5}
        pcbY={1}
        schSheetName="MOSFET A"
        schX={2}
        schY={0.55}
      />
      <trace from=".R1 > .pin2" to=".Q1 > .G1" />
      <trace from=".R2 > .pin1" to=".Q1 > .D1" />

      <chip
        name="Q1"
        footprint="soic8"
        noSchematicRepresentation
        pcbX={0}
        pcbY={0}
        pinLabels={{
          pin1: "G1",
          pin2: "S1",
          pin3: "G2",
          pin4: "S2",
          pin5: "D2",
          pin6: "D2",
          pin7: "D1",
          pin8: "D1",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
