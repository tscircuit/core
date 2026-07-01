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
 * BUG: the shared bus should be labeled on every sheet it reaches. Instead the
 * cross-subcircuit "connectivity" net label collapses to a single label per bus
 * (net labels are de-duplicated by connectivity key across the whole circuit,
 * not per sheet, in
 * Group_doInitialSchematicTraceRender/insertNetLabelsForPortsMissingTrace), and
 * that surviving label is drawn on one sheet while positioned at a pin that only
 * exists on another sheet. So the sensor and power monitor sheets end up with no
 * bus label at all (matches system-block-desginer01-schematic.snap.svg).
 *
 * The assertions describe the DESIRED behavior, so they fail today - hence
 * `test.failing`. When the core fix lands they pass, `test.failing` turns red,
 * and you drop `.failing` + refresh the snapshot.
 */
test.failing(
  "multi-sheet shared bus: cross-subcircuit net label lands on the wrong sheet",
  async () => {
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
        <trace
          from=".controller > .U1 > .PA1"
          to=".power_monitor > .U1 > .SDA"
        />
        <trace
          from=".controller > .U1 > .PA0"
          to=".power_monitor > .U1 > .SCL"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    // Snapshot of the current (buggy) render, taken before the failing
    // assertions below so it is still produced.
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

    // DESIRED: the bus reaches the sensor and the power monitor, so each of their
    // sheets should carry its bus net label. Today the label collapses onto one
    // sheet, so these get none.
    expect(busLabelsOnSheet("sensor")).not.toHaveLength(0)
    expect(busLabelsOnSheet("power_monitor")).not.toHaveLength(0)
  },
)
