import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb constraint xDist between groups with centerX", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack>
      <group name="group1" pcbPack>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
      <group name="group2" pcbPack>
        <resistor name="R3" resistance="1k" footprint="0402" />
        <resistor name="R4" resistance="1k" footprint="0402" />
      </group>
      <constraint
        pcb
        centerToCenter
        left=".group1"
        right=".group2"
        xDist="20mm"
        centerX={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Get pcb_groups for group1 and group2
  const sourceGroups = circuit.db.source_group.list()
  const group1Source = sourceGroups.find((g) => g.name === "group1")!
  const group2Source = sourceGroups.find((g) => g.name === "group2")!

  expect(group1Source).toBeTruthy()
  expect(group2Source).toBeTruthy()

  const pcbGroups = circuit.db.pcb_group.list()
  const group1Pcb = pcbGroups.find(
    (g) => g.source_group_id === group1Source.source_group_id,
  )!
  const group2Pcb = pcbGroups.find(
    (g) => g.source_group_id === group2Source.source_group_id,
  )!

  expect(group1Pcb).toBeTruthy()
  expect(group2Pcb).toBeTruthy()

  // The center of the pair should be at x=0
  // group1 should be at x=-10mm and group2 at x=+10mm (or vice versa)
  const midpointX = (group1Pcb.center.x + group2Pcb.center.x) / 2
  expect(Math.abs(midpointX)).toBeLessThan(0.5) // Close to 0

  // The distance between group centers should be ~20mm
  const xDistance = Math.abs(group2Pcb.center.x - group1Pcb.center.x)
  expect(xDistance).toBeCloseTo(20, 0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
