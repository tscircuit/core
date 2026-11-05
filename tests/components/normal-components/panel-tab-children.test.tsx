import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit paneltab children replace automatic tabs", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" panelizationMethod="tab-routing" tabLength="3mm">
      <board name="B1" width="20mm" height="20mm" routingDisabled>
        <pcbnotetext text="Only right edge: explicit paneltab" fontSize={0.5} />
      </board>
      <paneltab boardName="B1" edge="right" offset="6mm" />
    </panel>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_hole.list()).toHaveLength(2)
  for (const hole of circuit.db.pcb_hole.list()) expect(hole.x).toBe(10)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
