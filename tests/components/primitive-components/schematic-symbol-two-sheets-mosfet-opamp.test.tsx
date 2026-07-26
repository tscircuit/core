import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol maps a MOSFET and op-amp across two sheets", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="26mm" height="16mm">
      <schematicsheet name="MOSFET" displayName="MOSFET" sheetIndex={0} />
      <schematicsheet name="Op-Amp" displayName="Op-Amp" sheetIndex={1} />

      <chip
        name="Q1"
        footprint="sot23"
        noSchematicRepresentation
        pcbX={-4}
        pcbY={0}
        pinLabels={{ pin1: "G", pin2: "S", pin3: "D" }}
      />
      <schematicsymbol
        name="A"
        chipRef=".Q1"
        symbolName="n_channel_e_mosfet_transistor_horz"
        connections={{
          gate: "Q1.G",
          source: "Q1.S",
          drain: "Q1.D",
        }}
        schSheetName="MOSFET"
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-8}
        pcbY={-1.5}
        schSheetName="MOSFET"
        schX={-2}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={1.5}
        schSheetName="MOSFET"
        schX={2}
      />
      <trace from=".R1 > .pin2" to=".Q1 > .G" />
      <trace from=".Q1 > .D" to=".R2 > .pin1" />

      <chip
        name="U1"
        footprint="soic8"
        noSchematicRepresentation
        pcbX={4}
        pcbY={0}
        pinLabels={{ pin1: "INP", pin2: "INN", pin3: "OUT" }}
      />
      <schematicsymbol
        name="B"
        chipRef=".U1"
        symbolName="opamp_no_power_right"
        connections={{
          inp1: "U1.INP",
          inp2: "U1.INN",
          out: "U1.OUT",
        }}
        schSheetName="Op-Amp"
      />
      <resistor
        name="R3"
        resistance="22k"
        footprint="0402"
        pcbX={0}
        pcbY={-2}
        schSheetName="Op-Amp"
        schX={-2}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={8}
        pcbY={-2}
        schSheetName="Op-Amp"
        schX={2}
      />
      <trace from=".R3 > .pin2" to=".U1 > .INP" />
      <trace from=".U1 > .OUT" to=".C1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicSheets = circuit.db.schematic_sheet.list()
  expect(
    Object.fromEntries(
      schematicSheets.map((sheet) => [
        sheet.name,
        circuit.db.schematic_trace.list({
          schematic_sheet_id: sheet.schematic_sheet_id,
        }).length,
      ]),
    ),
  ).toEqual({
    MOSFET: 2,
    "Op-Amp": 2,
  })

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
