import { test, expect } from "bun:test"
import type { PcbHoleCircleOrSquare } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip without SMT pads", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="HO1"
        footprint={
          <footprint>
            <hole diameter={2.5} pcbX={0} pcbY={0} />
          </footprint>
        }
      />
    </board>,
  )

  project.render()

  const chip = project.selectOne("chip")
  expect(chip).not.toBeNull()

  const hole = project.db.pcb_hole.list()[0]
  expect(hole).toBeDefined()
  expect((hole as PcbHoleCircleOrSquare).hole_diameter).toBe(2.5)

  const smtpads = project.db.pcb_smtpad.list()
  expect(smtpads.length).toBe(0)
})
