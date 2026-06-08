import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * repro127 (BUG): hybrid placement with TWO chips where only one is pinned.
 *
 * U1 is pinned at (6, 0); U2 and a resistor R1 are auto. The pinned U1 forces
 * "relative" layout mode, so matchpack never runs and BOTH unpositioned parts —
 * the second chip U2 and the resistor R1 — collapse onto the origin and overlap:
 *
 *   U1@(6,0)  U2@(0,0)  R1@(0,0)
 *
 * EXPECTED (after fix): U2 and R1 should be auto-laid-out around the pinned U1
 * (e.g. U2 placed relative to U1 via their connection, R1 beside U2) with no
 * overlaps. Asserts the BUGGY stacked state for now.
 */
test("repro127: hybrid two chips (one pinned) collapses the auto chip + passive onto the origin", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="80mm" height="60mm">
      <chip name="U1" footprint="soic8" schX={6} schY={0} />
      <chip name="U2" footprint="soic8" />
      <resistor name="R1" resistance="1k" footprint="0402" />
      <trace from="U1.pin1" to="U2.pin1" />
      <trace from="U2.pin2" to="R1.pin1" />
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

  // BUG: the auto chip and the auto resistor both sit at the origin.
  expect(centerOf("U1").x).toBeCloseTo(6)
  expect(centerOf("U2")).toEqual({ x: 0, y: 0 })
  expect(centerOf("R1")).toEqual({ x: 0, y: 0 })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
