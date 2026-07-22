import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const interfaceChipPinLabels = {
  pin1: "VDD",
  pin2: "GND",
  pin3: "RESET",
  pin4: "TX",
  pin5: "RX",
  pin6: "IRQ",
}

test("schematic boxes connect on sheets through schSheetName", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="12mm">
      <chip
        name="U1"
        footprint="soic6"
        pinLabels={interfaceChipPinLabels}
        pcbX={0}
        pcbY={0}
      />

      <schematicsheet
        name="Power Sheet"
        displayName="Power Sheet"
        sheetIndex={0}
      />
      <schematicsheet
        name="Interface Sheet"
        displayName="Interface Sheet"
        sheetIndex={1}
      />

      <schematicbox
        name="U1 Power"
        schSheetName="Power Sheet"
        width={2.4}
        height={1.2}
        chipRef=".U1"
        schX={0}
        schY={0}
        pinLabels={{ pin1: "VDD", pin2: "GND", pin3: "RESET" }}
        schPinArrangement={{
          leftSide: ["pin1", "pin2", "pin3"],
          rightSide: [],
        }}
      />
      <resistor
        name="R1"
        schSheetName="Power Sheet"
        resistance="10k"
        footprint="0402"
        schX={-2.5}
        schY={-0.2}
        pcbX={-4}
        pcbY={0}
        connections={{ pin1: "U1.RESET" }}
      />

      <schematicbox
        name="U1 Interface"
        schSheetName="Interface Sheet"
        width={2.4}
        height={1.2}
        chipRef=".U1"
        schX={0}
        schY={0}
        pinLabels={{ pin1: "TX", pin2: "RX", pin3: "IRQ" }}
        schPinArrangement={{
          leftSide: ["pin1", "pin2", "pin3"],
          rightSide: [],
        }}
      />
      <resistor
        name="R2"
        schSheetName="Interface Sheet"
        resistance="1k"
        footprint="0402"
        schX={-2.5}
        schY={0.2}
        pcbX={4}
        pcbY={0}
        connections={{ pin1: "U1.TX" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
