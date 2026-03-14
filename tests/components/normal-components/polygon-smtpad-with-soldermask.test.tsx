import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Snapshot test for polygon-shaped smtpads with solder mask coverage.
 *
 * Demonstrates using polygon smtpads to create a 5-segment capacitive touch
 * slider footprint — a common use case where pads must be covered with solder
 * mask so the finger is insulated from direct electrical contact.
 *
 * Relates to: https://github.com/tscircuit/tscircuit/issues/786
 */
test("polygon smtpad with soldermask - capacitive touch slider", () => {
  const { project } = getTestFixture()

  const segmentCount = 5
  const spacing = 3.0 // mm between segment centers

  // Diamond-shaped polygon points (relative to pad center)
  const diamondPoints = (hw: number, hh: number) => [
    { x: 0, y: hh },
    { x: hw, y: 0 },
    { x: 0, y: -hh },
    { x: -hw, y: 0 },
  ]

  project.add(
    <board width="22mm" height="12mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            {Array.from({ length: segmentCount }, (_, i) => {
              const cx = (i - Math.floor(segmentCount / 2)) * spacing
              return (
                <smtpad
                  key={i}
                  shape="polygon"
                  layer="top"
                  pcbX={cx}
                  pcbY={0}
                  portHints={[`pin${i + 1}`]}
                  coveredWithSolderMask
                  points={diamondPoints(1.2, 1.8)}
                />
              )
            })}
          </footprint>
        }
      />
    </board>,
  )

  project.render()

  // Verify all 5 pads have solder mask coverage set
  const pads = project.db.pcb_smtpad.list()
  expect(pads).toHaveLength(segmentCount)
  for (const pad of pads) {
    expect(pad.is_covered_with_solder_mask).toBe(true)
    expect(pad.shape).toBe("polygon")
  }

  // Verify no solder paste is generated for solder-mask-covered pads
  expect(project.db.pcb_solder_paste.list()).toHaveLength(0)

  // Visual PCB snapshot
  expect(project).toMatchPcbSnapshot(import.meta.path)
})
