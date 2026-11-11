import { expect, test } from "bun:test"
import type { GroupProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Battery monitor from https://tscircuit.com/gokul/lora-device (0.1.6).
// Retain R16/R17/C21 values and connections, but replace the board's section
// layout with a grid to reproduce the ignored schematic-specific settings.
export default function LoRaBatteryMonitorGrid({
  gridProps = { schGridCols: 1, schGridGap: 5 },
}: {
  gridProps?: Pick<GroupProps, "schGridCols" | "schGridGap" | "gridCols">
}) {
  return (
    <board>
      <net name="VBAT" isPowerNet />
      <net name="BAT_SENSE" />
      <net name="GND" isGroundNet />
      <group name="BatteryMonitor" schGrid {...gridProps}>
        <resistor
          name="R16"
          resistance="1M"
          connections={{ pin1: "net.VBAT", pin2: "net.BAT_SENSE" }}
        />
        <resistor
          name="R17"
          resistance="1M"
          connections={{ pin1: "net.BAT_SENSE", pin2: "net.GND" }}
        />
        <capacitor
          name="C21"
          capacitance="100nF"
          connections={{ pin1: "net.BAT_SENSE", pin2: "net.GND" }}
        />
      </group>
    </board>
  )
}

test("LoRa battery monitor respects schGridCols and schGridGap", async () => {
  for (const { snapshotName, gridProps } of [
    {
      // Both settings come from the schematic-specific props.
      snapshotName: "schematic-props",
      gridProps: { schGridCols: 1, schGridGap: 5 },
    },
    {
      // The generic column count still works with a schematic-specific gap.
      snapshotName: "schematic-gap",
      gridProps: { gridCols: 1, schGridGap: 5 },
    },
  ]) {
    const { circuit } = getTestFixture()
    circuit.pcbDisabled = true
    circuit.add(<LoRaBatteryMonitorGrid gridProps={gridProps} />)
    await circuit.renderUntilSettled()

    const schematicComponents = circuit.db.schematic_component.list()
    const [first, second, third] = schematicComponents
    expect(second.center.x).toBeCloseTo(first.center.x)
    expect(third.center.x).toBeCloseTo(first.center.x)
    const cellHeight = Math.max(
      ...schematicComponents.map((c) => c.size.height),
    )
    expect(first.center.y - second.center.y - cellHeight).toBeCloseTo(5)
    expect(second.center.y - third.center.y - cellHeight).toBeCloseTo(5)

    await expect(circuit).toMatchSchematicSnapshot(
      import.meta.path.replace(".test.tsx", `-${snapshotName}.test.tsx`),
      { width: 800, height: 1000, grid: { cellSize: 1, labelCells: true } },
    )
  }
})
