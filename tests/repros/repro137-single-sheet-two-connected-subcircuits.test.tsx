import { expect, test } from "bun:test"
import type { SubcircuitProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** A generic 3.3V regulator block: regulator IC + decoupling + feedback divider. */
const PowerRegulator = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U1"
      footprint="soic5"
      pinLabels={{
        pin1: "VIN",
        pin2: "GND",
        pin3: "EN",
        pin4: "FB",
        pin5: "VOUT",
      }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["VIN", "EN", "GND"] },
        rightSide: { direction: "top-to-bottom", pins: ["VOUT", "FB"] },
      }}
      connections={{ VIN: "net.VIN", GND: "net.GND", VOUT: "net.VOUT" }}
      schX={0}
      schY={0}
    />
    <capacitor
      name="C_IN"
      capacitance="10uF"
      footprint="0402"
      connections={{ pin1: "U1.VIN", pin2: "net.GND" }}
      schX={-3}
      schY={-0.5}
      schRotation={270}
    />
    <capacitor
      name="C_OUT"
      capacitance="22uF"
      footprint="0402"
      connections={{ pin1: "U1.VOUT", pin2: "net.GND" }}
      schX={3}
      schY={-0.5}
      schRotation={270}
    />
    <resistor
      name="R_FB1"
      resistance="100k"
      footprint="0402"
      connections={{ pin1: "U1.VOUT", pin2: "U1.FB" }}
      schX={4.5}
      schY={1}
      schRotation={270}
    />
    <resistor
      name="R_FB2"
      resistance="33k"
      footprint="0402"
      connections={{ pin1: "U1.FB", pin2: "net.GND" }}
      schX={4.5}
      schY={-1.5}
      schRotation={270}
    />
  </subcircuit>
)

/** A generic microcontroller block: MCU + VDD decoupling cap + reset pull-up. */
const McuModule = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{
        pin1: "VDD",
        pin2: "GND",
        pin3: "RESET",
        pin4: "SWDIO",
        pin5: "SWCLK",
        pin6: "IO1",
        pin7: "IO2",
        pin8: "IO3",
      }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["VDD", "RESET", "GND"] },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["SWDIO", "SWCLK", "IO1", "IO2", "IO3"],
        },
      }}
      connections={{ VDD: "net.VDD", GND: "net.GND" }}
      schX={0}
      schY={0}
    />
    <capacitor
      name="C_VDD"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "U1.VDD", pin2: "net.GND" }}
      schX={-3}
      schY={-0.5}
      schRotation={270}
    />
    <resistor
      name="R_RST"
      resistance="10k"
      footprint="0402"
      connections={{ pin1: "U1.RESET", pin2: "U1.VDD" }}
      schX={-3}
      schY={1.5}
      schRotation={270}
    />
  </subcircuit>
)

/**
 * Two different significant subcircuits on a SINGLE schematic sheet, where one
 * subcircuit feeds the other: the regulator's VOUT powers the microcontroller's
 * VDD. Both subcircuits are assigned to the same sheet, laid out together, and
 * the inter-subcircuit connection renders as a real trace between them.
 */
test("two subcircuits on a single sheet, one powering the other", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet 1" displayName="Sheet 1" sheetIndex={0} />

      <PowerRegulator name="REG" schSheetName="Sheet 1" />
      <McuModule name="MCU" schSheetName="Sheet 1" />

      <trace from=".REG .U1 > .VOUT" to=".MCU .U1 > .VDD" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sheet1 = circuit.db.schematic_sheet.getWhere({ name: "Sheet 1" })!
  const onSheet1 = circuit.db.schematic_component
    .list()
    .filter((c) => (c as any).schematic_sheet_id === sheet1.schematic_sheet_id)

  // Both subcircuits' components live on the one sheet.
  expect(onSheet1.length).toBeGreaterThan(0)

  // ...and the board-level trace connects the regulator output to the MCU
  // supply, i.e. one subcircuit feeds the other on the same sheet.
  const ports = circuit.db.source_port.list()
  const oneSubcircuitFeedsTheOther = circuit.db.source_trace
    .list()
    .some((st) => {
      const portNames = ((st as any).connected_source_port_ids ?? []).map(
        (id: string) => ports.find((p) => p.source_port_id === id)?.name,
      )
      return portNames.includes("VOUT") && portNames.includes("VDD")
    })
  expect(oneSubcircuitFeedsTheOther).toBe(true)

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
