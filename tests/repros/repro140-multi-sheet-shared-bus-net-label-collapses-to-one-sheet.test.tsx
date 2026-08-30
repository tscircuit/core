import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * REPRO of a multi-sheet schematic bug hit by the system-block-designer.
 *
 * Each block lives on its own schematic sheet (`<schematicsheet>` + a
 * `<subcircuit>` pinned via `schSheetName`, chip `U1` inside), and blocks are
 * connected by board-level direct pin-to-pin traces: the controller's PA0/PA1
 * drive BOTH peripherals' SCL/SDA - a bus that spans all three sheets. The three
 * chips are placed at different positions so a given coordinate is a pin on only
 * one sheet.
 *
 * The shared bus should be labeled on every sheet it reaches. The bug was that
 * the cross-subcircuit "connectivity" net label collapsed to a single label per
 * bus (net labels were de-duplicated by connectivity key across the whole
 * circuit, not per sheet, in
 * Group_doInitialSchematicTraceRender/insertNetLabelsForPortsMissingTrace) and
 * that surviving label was drawn on one sheet while positioned at a pin that only
 * exists on another sheet - so the sensor and power monitor sheets ended up with
 * no bus label at all (matched system-block-desginer01-schematic.snap.svg).
 *
 * The fix scopes net-label de-duplication to the port's own schematic sheet and
 * stamps each label with that sheet, so every sheet the bus reaches gets its own
 * label anchored to its own pin. This test guards against a regression.
 */
test("multi-sheet shared bus: cross-subcircuit net label is created on every sheet it reaches", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="controller"
        displayName="Microcontroller"
        sheetIndex={0}
      />
      <schematicsheet
        name="sensor"
        displayName="Environmental Sensor"
        sheetIndex={1}
      />
      <schematicsheet
        name="power_monitor"
        displayName="Power Monitor"
        sheetIndex={2}
      />

      {/* Three simple chips, each on its own sheet, placed at different positions. */}
      <subcircuit name="controller" schSheetName="controller">
        <chip
          name="U1"
          footprint="soic6"
          schX={0}
          schY={0}
          pinLabels={{ pin1: "VDD", pin2: "GND", pin3: "PA0", pin4: "PA1" }}
          schPinArrangement={{
            leftSide: { direction: "top-to-bottom", pins: ["VDD", "GND"] },
            rightSide: { direction: "top-to-bottom", pins: ["PA0", "PA1"] },
          }}
          connections={{ VDD: "net.VDD", GND: "net.GND" }}
        />
      </subcircuit>

      <subcircuit name="sensor" schSheetName="sensor">
        <chip
          name="U1"
          footprint="soic6"
          schX={3}
          schY={2}
          pinLabels={{ pin1: "VDD", pin2: "GND", pin3: "SDA", pin4: "SCL" }}
          schPinArrangement={{
            leftSide: { direction: "top-to-bottom", pins: ["SDA", "SCL"] },
            rightSide: { direction: "top-to-bottom", pins: ["VDD", "GND"] },
          }}
          connections={{ VDD: "net.VDD", GND: "net.GND" }}
        />
      </subcircuit>

      <subcircuit name="power_monitor" schSheetName="power_monitor">
        <chip
          name="U1"
          footprint="soic6"
          schX={-3}
          schY={-2}
          pinLabels={{ pin1: "VDD", pin2: "GND", pin3: "SDA", pin4: "SCL" }}
          schPinArrangement={{
            leftSide: { direction: "top-to-bottom", pins: ["SDA", "SCL"] },
            rightSide: { direction: "top-to-bottom", pins: ["VDD", "GND"] },
          }}
          connections={{ VDD: "net.VDD", GND: "net.GND" }}
        />
      </subcircuit>

      {/* Shared I2C bus: controller PA1 -> both SDAs, controller PA0 -> both SCLs. */}
      <trace from=".controller > .U1 > .PA1" to=".sensor > .U1 > .SDA" />
      <trace from=".controller > .U1 > .PA0" to=".sensor > .U1 > .SCL" />
      <trace from=".controller > .U1 > .PA1" to=".power_monitor > .U1 > .SDA" />
      <trace from=".controller > .U1 > .PA0" to=".power_monitor > .U1 > .SCL" />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)

  // The cross-subcircuit bus net labels (the auto-generated "connectivity"
  // labels, as opposed to the named VDD/GND nets) on a given sheet.
  const busLabelsOnSheet = (name: string) => {
    const sheet = circuit.db.schematic_sheet.getWhere({ name })!
    return circuit.db.schematic_net_label
      .list()
      .filter(
        (l) =>
          (l as any).schematic_sheet_id === sheet.schematic_sheet_id &&
          (l as any).source_net_id?.includes("connectivity_net"),
      )
  }

  // The bus reaches the sensor and the power monitor, so each of their sheets
  // carries its own bus net label (it is not collapsed onto a single sheet).
  expect(busLabelsOnSheet("sensor")).not.toHaveLength(0)
  expect(busLabelsOnSheet("power_monitor")).not.toHaveLength(0)
})
