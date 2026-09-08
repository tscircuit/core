import { expect, test } from "bun:test"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

export default function BatteryChargerStatusMonitor() {
  return (
    <board name="BATTERY_CHARGER_STATUS_MONITOR" pcbPack pcbPackGap="0.5mm">
      <net name="VCC" isPowerNet />
      <net name="GND" isGroundNet />

      <schematictext
        text="REPRO183: auto-layout places R_CHG overlapping U1 when aligning rail loads on opposite sides"
        schX={0}
        schY={4.5}
        fontSize={0.25}
      />

      {/* Battery Charger IC */}
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "STAT1",
          pin2: "STAT2",
          pin3: "PROG",
          pin4: "GND",
          pin5: "BAT",
          pin6: "PG_N",
          pin7: "FAULT_N",
          pin8: "VIN",
        }}
      />
      <trace from=".U1 > .VIN" to="net.VCC" />
      <trace from=".U1 > .GND" to="net.GND" />

      {/* Input decoupling capacitor */}
      <capacitor name="C_IN" capacitance="10uF" footprint="1206" />
      <trace from="net.VCC" to=".C_IN > .pin1" />
      <trace from=".C_IN > .pin2" to="net.GND" />

      {/* Charge current programming resistor */}
      <resistor name="R_PROG" resistance="2.4k" footprint="0805" />
      <trace from=".U1 > .PROG" to=".R_PROG > .pin1" />
      <trace from=".R_PROG > .pin2" to="net.GND" />

      {/* Battery output filter capacitor */}
      <capacitor name="C_BAT" capacitance="10uF" footprint="1206" />
      <trace from=".U1 > .BAT" to=".C_BAT > .pin1" />
      <trace from=".C_BAT > .pin2" to="net.GND" />

      {/* Left side active-low status indicators */}
      <led name="D_CHG" footprint="0805" />
      <resistor name="R_CHG" resistance="1k" footprint="0805" />
      <trace from="net.VCC" to=".D_CHG > .pin1" />
      <trace from=".D_CHG > .pin2" to=".R_CHG > .pin1" />
      <trace from=".R_CHG > .pin2" to=".U1 > .STAT1" />

      <led name="D_DONE" footprint="0805" />
      <resistor name="R_DONE" resistance="1k" footprint="0805" />
      <trace from="net.VCC" to=".D_DONE > .pin1" />
      <trace from=".D_DONE > .pin2" to=".R_DONE > .pin1" />
      <trace from=".R_DONE > .pin2" to=".U1 > .STAT2" />

      {/* Right side active-low status indicators */}
      <led name="D_PG" footprint="0805" />
      <resistor name="R_PG" resistance="1k" footprint="0805" />
      <trace from="net.VCC" to=".D_PG > .pin1" />
      <trace from=".D_PG > .pin2" to=".R_PG > .pin1" />
      <trace from=".R_PG > .pin2" to=".U1 > .PG_N" />

      <led name="D_FAULT" footprint="0805" />
      <resistor name="R_FAULT" resistance="1k" footprint="0805" />
      <trace from="net.VCC" to=".D_FAULT > .pin1" />
      <trace from=".D_FAULT > .pin2" to=".R_FAULT > .pin1" />
      <trace from=".R_FAULT > .pin2" to=".U1 > .FAULT_N" />
    </board>
  )
}

test("repro183: battery charger status monitor auto-layout causes U1 and R_CHG component overlap", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<BatteryChargerStatusMonitor />)
  await circuit.renderUntilSettled()

  const getRenderedBounds = (componentName: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((c) => c.name === componentName)
    if (!sourceComponent) {
      throw new Error(`Source component ${componentName} not found`)
    }
    const schematicComponent = circuit.db.schematic_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })
    if (!schematicComponent) {
      throw new Error(`Schematic component ${componentName} not found`)
    }
    const textBounds = getSchematicComponentWithTextBounds({
      db: circuit.db,
      schematicComponent,
    })
    if (textBounds) return textBounds

    return {
      minX: schematicComponent.center.x - schematicComponent.size.width / 2,
      maxX: schematicComponent.center.x + schematicComponent.size.width / 2,
      minY: schematicComponent.center.y - schematicComponent.size.height / 2,
      maxY: schematicComponent.center.y + schematicComponent.size.height / 2,
    }
  }

  // U1 and R_CHG overlap because AlignChipConnectedRailLoadsSolver places
  // the rail-connected load group without accounting for the chip boundary.
  const u1Bounds = getRenderedBounds("U1")
  const rChgBounds = getRenderedBounds("R_CHG")
  const u1RChgOverlap =
    u1Bounds.minX < rChgBounds.maxX &&
    u1Bounds.maxX > rChgBounds.minX &&
    u1Bounds.minY < rChgBounds.maxY &&
    u1Bounds.maxY > rChgBounds.minY

  // TODO: Change to toBe(false) once matchpack fixes AlignChipConnectedRailLoadsSolver
  expect(u1RChgOverlap).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
