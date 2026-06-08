import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * repro126 (BUG): hybrid placement with a PINNED chip and AUTO decoupling caps.
 *
 * A very common pattern: pin a chip at a chosen schematic location and let its
 * decoupling capacitors auto-place. Because the chip carries schX/schY, the
 * whole subcircuit falls into "relative" layout mode, matchpack never runs, and
 * the unpositioned capacitors keep their default center of (0, 0) — all three
 * caps stack on each other AND on the pinned chip:
 *
 *   U1@(0,0)  C1@(0,0)  C2@(0,0)  C3@(0,0)
 *
 * EXPECTED (after fix): the auto capacitors should be placed around the pinned
 * chip with no overlaps. Asserts the BUGGY stacked state for now.
 */
test("repro126: hybrid pinned chip + auto decoupling caps stack on the chip", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="80mm" height="60mm">
      <chip name="U1" footprint="soic8" schX={0} schY={0} />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <capacitor name="C2" capacitance="100nF" footprint="0402" />
      <capacitor name="C3" capacitance="100nF" footprint="0402" />
      <trace from="U1.pin1" to="C1.pin1" />
      <trace from="U1.pin2" to="C2.pin1" />
      <trace from="U1.pin3" to="C3.pin1" />
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

  // BUG: every auto capacitor sits at the origin, on top of the pinned chip.
  expect(centerOf("U1")).toEqual({ x: 0, y: 0 })
  expect(centerOf("C1")).toEqual({ x: 0, y: 0 })
  expect(centerOf("C2")).toEqual({ x: 0, y: 0 })
  expect(centerOf("C3")).toEqual({ x: 0, y: 0 })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
