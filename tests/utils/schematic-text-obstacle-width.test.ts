import { expect, test } from "bun:test"
import { getSchematicTextObstacleWidth } from "lib/utils/schematic/getSchematicTextObstacleWidth"

test("schematic text obstacle width uses proportional font advances", () => {
  const fontSize = 0.18
  const narrow = getSchematicTextObstacleWidth({ text: "iiii", fontSize })
  const wide = getSchematicTextObstacleWidth({ text: "WWWW", fontSize })

  // A fixed per-character width cannot distinguish these equal-length labels.
  expect(wide).toBeGreaterThan(narrow * 3)
  expect(wide).toBeGreaterThan(fontSize * 3.5)
  expect(narrow).toBeLessThan(fontSize)

  const mpn = "USB-C 16P SMD receptacle (DX07B024 style)"
  const width = getSchematicTextObstacleWidth({ text: mpn, fontSize })
  // The rendered sans-serif text is roughly 3.7-4.1 mm, not the old 4.92 mm.
  expect(width).toBeGreaterThan(3.5)
  expect(width).toBeLessThan(4.2)
  expect(
    getSchematicTextObstacleWidth({ text: mpn, fontSize: fontSize * 2 }),
  ).toBeCloseTo(width * 2)
  expect(getSchematicTextObstacleWidth({ text: "", fontSize })).toBe(0)

  // Keep the prior estimate for characters outside the font metrics table.
  expect(getSchematicTextObstacleWidth({ text: "10kΩ", fontSize })).toBeCloseTo(
    0.48,
  )
})
