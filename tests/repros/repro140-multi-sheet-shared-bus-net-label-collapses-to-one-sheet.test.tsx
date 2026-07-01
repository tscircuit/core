import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * REPRO of a multi-sheet schematic bug hit by the system-block-designer.
 *
 * The system-block-designer puts each functional block on its own schematic
 * sheet: a `<schematicsheet>` whose name matches the block's subcircuit instance
 * name, a `<subcircuit>` pinned to that sheet via `schSheetName`, and a chip `U1`
 * inside it. Inter-block connections are board-level, direct pin-to-pin traces
 * addressed as `.<block> > .U1 > .<pin>` (no explicit net name), e.g. an I2C bus
 * where the controller's PA0/PA1 drive BOTH peripherals' SCL/SDA.
 *
 * This test mirrors that exact wiring with minimal chips instead of the real TI
 * subcircuits (the controller carries I2C pull-ups on PA0/PA1, like the real
 * MSPM0 block, so those pins are already connected on the controller's sheet).
 *
 * BUG: each shared bus electrically spans all three sheets, so it should be
 * labeled on every sheet it touches. Instead the auto-generated cross-subcircuit
 * "connectivity" net label collapses to a SINGLE net label on a SINGLE
 * (arbitrary) sheet - net labels are de-duplicated by connectivity key across
 * the whole circuit rather than per schematic sheet in
 * Group_doInitialSchematicTraceRender/insertNetLabelsForPortsMissingTrace, and
 * each label's schematic_sheet_id comes from the rendering group rather than the
 * anchored port's own component.
 *
 * Concrete symptom (matches system-block-desginer01-schematic.snap.svg): the
 * "U1_PA0" label - which belongs to the controller's I2C bus reaching BOTH
 * peripherals - shows up on the *sensor* sheet, while the *power monitor* sheet
 * (on the very same bus) gets no bus label at all.
 *
 * The assertions describe the DESIRED behavior (each cross-sheet bus is labeled
 * on every sheet it touches), so they fail today. The test is marked
 * `test.failing`: it registers as a known failure now and will flip to a real
 * failure once the core fix lands - at which point drop `.failing` and refresh
 * the snapshot.
 */
test.failing(
  "multi-sheet shared bus: cross-subcircuit connectivity net label collapses to one sheet",
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

        {/* Controller: MCU with I2C pull-ups on PA0/PA1 (like the real MSPM0 block). */}
        <subcircuit name="controller" schSheetName="controller">
          <chip
            name="U1"
            footprint="soic8"
            pinLabels={{ pin1: "VDD", pin2: "GND", pin3: "PA0", pin4: "PA1" }}
            schPinArrangement={{
              leftSide: { direction: "top-to-bottom", pins: ["VDD", "GND"] },
              rightSide: { direction: "top-to-bottom", pins: ["PA0", "PA1"] },
            }}
            connections={{ VDD: "net.VDD", GND: "net.GND" }}
          />
          <resistor
            name="R3"
            resistance="4.7k"
            footprint="0402"
            connections={{ pin1: "U1.PA0", pin2: "net.VDD" }}
          />
          <resistor
            name="R4"
            resistance="4.7k"
            footprint="0402"
            connections={{ pin1: "U1.PA1", pin2: "net.VDD" }}
          />
        </subcircuit>

        <subcircuit name="sensor" schSheetName="sensor">
          <chip
            name="U1"
            footprint="soic6"
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
            footprint="soic8"
            pinLabels={{ pin1: "VS", pin2: "GND", pin3: "SDA", pin4: "SCL" }}
            schPinArrangement={{
              leftSide: { direction: "top-to-bottom", pins: ["SDA", "SCL"] },
              rightSide: { direction: "top-to-bottom", pins: ["VS", "GND"] },
            }}
            connections={{ VS: "net.VDD", GND: "net.GND" }}
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

    const sheetNameById = new Map(
      circuit.db.schematic_sheet
        .list()
        .map((s) => [s.schematic_sheet_id, s.name]),
    )
    expect(sheetNameById.size).toBe(3)

    // Group the board-level (root group) cross-subcircuit bus net labels by
    // connectivity net and record which sheets each lands on.
    const sheetsByBusNet = new Map<string, Set<string>>()
    for (const label of circuit.db.schematic_net_label.list()) {
      const sourceNetId = (label as any).source_net_id as string | undefined
      if (!sourceNetId?.includes("subcircuit_source_group")) continue
      if (!sourceNetId.includes("connectivity_net")) continue
      const sheetName =
        sheetNameById.get((label as any).schematic_sheet_id) ?? "(none)"
      if (!sheetsByBusNet.has(sourceNetId)) {
        sheetsByBusNet.set(sourceNetId, new Set())
      }
      sheetsByBusNet.get(sourceNetId)!.add(sheetName)
    }
    expect(sheetsByBusNet.size).toBeGreaterThan(0)

    // The stacked snapshot captures the current (buggy) rendering: a "U1_PA0"
    // label on the sensor sheet, and no bus label on the power_monitor sheet.
    await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)

    // DESIRED: each shared bus spans controller + sensor + power_monitor, so it
    // should be labeled on all three sheets. Today each collapses to one sheet.
    for (const [, sheets] of sheetsByBusNet) {
      expect(sheets.size).toBe(3)
    }

    // DESIRED: the power_monitor sheet is on both buses, so it should show a bus
    // net label rather than none.
    const powerMonitorSheetId = circuit.db.schematic_sheet.getWhere({
      name: "power_monitor",
    })!.schematic_sheet_id
    const busLabelsOnPowerMonitor = circuit.db.schematic_net_label
      .list()
      .filter((l) => {
        const src = (l as any).source_net_id as string | undefined
        return (
          !!src?.includes("subcircuit_source_group") &&
          src.includes("connectivity_net") &&
          (l as any).schematic_sheet_id === powerMonitorSheetId
        )
      })
    expect(busLabelsOnPowerMonitor.length).toBeGreaterThan(0)
  },
)
