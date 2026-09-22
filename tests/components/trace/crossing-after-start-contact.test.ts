import { test, expect } from "bun:test"
import { createSchematicTraceCrossingSegments } from "lib/components/primitive-components/Trace/trace-utils/create-schematic-trace-crossing-segments"

test("start contact does not suppress later crossings (#3729)", () => {
  const edges = [{ from: { x: 0, y: 0 }, to: { x: 10, y: 0 } }]
  const otherEdges = [0, 4, 7].map((x) => ({
    from: { x, y: -1 },
    to: { x, y: 1 },
  }))

  const result = createSchematicTraceCrossingSegments({
    edges: edges as any,
    otherEdges: otherEdges as any,
  })

  const crossings = result.filter((e) => e.is_crossing)
  // No crossing at x=0 (contact at edge start), but crossings at x=4, x=7
  expect(crossings.length).toBe(2)
  expect(crossings[0].from.x).toBeCloseTo(4 - 0.0375)
  expect(crossings[1].from.x).toBeCloseTo(7 - 0.0375)
})
