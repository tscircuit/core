import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fuses retain ratings, grouped placement, pads and ports when imported from Circuit JSON", async () => {
  const { circuit: original } = getTestFixture()
  original.add(
    <board width={24} height={18}>
      <group name="POWER" pcbX={-3} pcbY={2} pcbRotation={90}>
        <fuse
          name="F1"
          currentRating="250mA"
          voltageRating="24V"
          footprint="0603"
          pcbX={-3}
          pcbRotation={90}
        />
        <fuse
          name="F2"
          currentRating="2A"
          voltageRating="60V"
          footprint="0805"
          pcbX={3}
          layer="bottom"
        />
      </group>
    </board>,
  )
  await original.renderUntilSettled()
  const sourceJson = original.getCircuitJson()
  const { circuit: imported } = getTestFixture()
  imported.add(
    <board width={24} height={18}>
      <subcircuit name="CONTROLLER" circuitJson={sourceJson} />
    </board>,
  )
  await imported.renderUntilSettled()
  for (const name of ["F1", "F2"]) {
    const before = original.db.source_component.getWhere({ name })!
    const after = imported.db.source_component.getWhere({ name })!
    expect(after.ftype).toBe("simple_fuse")
    if (before.ftype !== "simple_fuse" || after.ftype !== "simple_fuse")
      throw new Error("Expected fuse source records")
    expect(after.current_rating_amps).toBe(before.current_rating_amps)
    expect(after.voltage_rating_volts).toBe(before.voltage_rating_volts)
    const beforePcb = original.db.pcb_component.getWhere({
      source_component_id: before.source_component_id,
    })!
    const afterPcb = imported.db.pcb_component.getWhere({
      source_component_id: after.source_component_id,
    })!
    expect(afterPcb.center.x).toBeCloseTo(beforePcb.center.x)
    expect(afterPcb.center.y).toBeCloseTo(beforePcb.center.y)
    expect(afterPcb.rotation).toBe(beforePcb.rotation)
    expect(afterPcb.layer).toBe(beforePcb.layer)
    expect(
      imported.db.pcb_smtpad
        .list()
        .filter((pad) => pad.pcb_component_id === afterPcb.pcb_component_id),
    ).toHaveLength(2)
    expect(
      imported.db.source_port
        .list()
        .filter(
          (port) => port.source_component_id === after.source_component_id,
        )
        .map((port) => port.name)
        .sort(),
    ).toEqual(["pin1", "pin2"])
    expect(after.source_group_id).toBe(
      imported.db.source_group.getWhere({ name: "POWER" })!.source_group_id,
    )
  }
  expect(
    imported.getCircuitJson().filter((e) => e.type.endsWith("_error")),
  ).toHaveLength(0)
  expect(imported).toMatchPcbSnapshot(import.meta.path)
  expect(imported).toMatchSchematicSnapshot(import.meta.path)
})
