import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Capacitive Touch Slider using polygon smtpads with coveredWithSolderMask
 *
 * A capacitive touch slider consists of multiple polygon-shaped SMT pads
 * covered with solder mask. The solder mask acts as the dielectric, and the
 * copper pads underneath form the capacitive sensing electrodes.
 *
 * Related issue: tscircuit/tscircuit#786
 */

/**
 * Generate a diamond (rhombus) polygon centered at offsetX, offsetY
 */
function diamondPoints(
  halfWidth: number,
  halfHeight: number,
  offsetX = 0,
  offsetY = 0,
) {
  return [
    { x: offsetX, y: offsetY + halfHeight },
    { x: offsetX + halfWidth, y: offsetY },
    { x: offsetX, y: offsetY - halfHeight },
    { x: offsetX - halfWidth, y: offsetY },
  ]
}

test("capacitive touch slider - 5 segment polygon smtpads with soldermask", () => {
  const { project } = getTestFixture()

  const NUM_PADS = 5
  const PAD_HALF_WIDTH = 1.2 // mm
  const PAD_HALF_HEIGHT = 2.5 // mm
  const SPACING = 3.0 // mm, center-to-center spacing

  project.add(
    <board width={`${NUM_PADS * SPACING + 4}mm`} height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            {Array.from({ length: NUM_PADS }, (_, i) => {
              const offsetX = (i - (NUM_PADS - 1) / 2) * SPACING
              return (
                <smtpad
                  key={i}
                  name={`pad${i + 1}`}
                  shape="polygon"
                  points={diamondPoints(PAD_HALF_WIDTH, PAD_HALF_HEIGHT, offsetX, 0)}
                  portHints={[`pin${i + 1}`]}
                  coveredWithSolderMask={true}
                />
              )
            })}
          </footprint>
        }
      />
    </board>,
  )

  project.render()

  const pads = project.db.pcb_smtpad.list()

  // Verify all 5 pads exist
  expect(pads).toHaveLength(NUM_PADS)

  // Verify all pads are polygon shape and covered with solder mask
  for (const pad of pads) {
    expect(pad.shape).toBe("polygon")
    expect(pad.is_covered_with_solder_mask).toBe(true)
  }

  // No solder paste should be generated for covered pads
  expect(project.db.pcb_solder_paste.list()).toHaveLength(0)

  // Each pad should have the correct number of polygon points (4 for diamond)
  for (const pad of pads) {
    if (pad.shape === "polygon") {
      expect(pad.points).toHaveLength(4)
    }
  }

  // Compute polygon centroids and verify they are distinct (pads spread along slider)
  const centroids = pads.map((pad) => {
    if (pad.shape === "polygon") {
      const pts = pad.points
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
      return Math.round(cx * 100) / 100
    }
    return 0
  })
  const uniqueCentroids = new Set(centroids)
  expect(uniqueCentroids.size).toBe(NUM_PADS)

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
