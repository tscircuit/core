import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * repro125 (BUG): hybrid schematic placement — some components pinned with
 * schX/schY, the rest auto — collapses every unpositioned component onto the
 * origin instead of laying them out around the pinned ones.
 *
 * Here a chip (U1), a resistor (R1) and a capacitor (C1) have no schematic
 * coordinates while C2 is pinned at (10, 0). Because ANY child with schX/schY
 * drops the subcircuit into "relative" layout mode (Group._getSchematicLayoutMode),
 * matchpack never runs and the three unpositioned components keep their default
 * center of (0, 0) — the chip and both passives stack on the same point.
 *
 *   U1@(0,0)  R1@(0,0)  C1@(0,0)  C2@(10,0)
 *
 * EXPECTED (after fix): the unpositioned chip + passives should be auto-laid-out
 * around the pinned C2 with no overlaps, the way `schAutoLayoutEnabled` already
 * does. This test currently asserts the BUGGY stacked state; flip these
 * assertions when the fix lands.
 */
test("repro125: hybrid (unpositioned chip + passives) collapse onto the origin", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="40mm">
      <chip name="U1" footprint="soic8" />
      <resistor name="R1" resistance="1k" footprint="0402" />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        schX={10}
        schY={0}
      />
      <trace from="U1.pin1" to="R1.pin1" />
      <trace from="U1.pin2" to="C1.pin1" />
      <trace from="U1.pin3" to="C2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const db = circuit.db
  const centerOf = (name: string) =>
    db.schematic_component
      .list()
      .find(
        (c) => db.source_component.get(c.source_component_id!)?.name === name,
      )!.center

  // BUG: the unpositioned chip and passives all sit at the origin.
  expect(centerOf("U1")).toEqual({ x: 0, y: 0 })
  expect(centerOf("R1")).toEqual({ x: 0, y: 0 })
  expect(centerOf("C1")).toEqual({ x: 0, y: 0 })
  // The pinned component keeps its coordinates.
  expect(centerOf("C2").x).toBeCloseTo(10)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
