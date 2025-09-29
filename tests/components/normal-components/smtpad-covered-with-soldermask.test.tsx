import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// ensure smtpad's coveredWithSolderMask prop sets is_covered_with_solder_mask
// on pcb_smtpad

test("smtpad coveredWithSolderMask sets is_covered_with_solder_mask", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              portHints={["pin1"]}
              coveredWithSolderMask
            />
          </footprint>
        }
      />
    </board>,
  )

  project.render()

  const pad = project.db.pcb_smtpad.list()[0]
  expect(pad.is_covered_with_solder_mask).toBe(true)
  expect(project.db.pcb_solder_paste.list()).toHaveLength(0)
})
