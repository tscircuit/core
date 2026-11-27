import { expect, test } from "bun:test"
import { createSchematicTraceCrossingSegments } from "lib/components/primitive-components/Trace/trace-utils/create-schematic-trace-crossing-segments"

test("start contact does not suppress later crossing markers along the same edge", () => {
  const cases = [
    {
      name: "horizontal left-to-right",
      edge: { from: { x: 0, y: 0 }, to: { x: 4, y: 0 } },
      startContact: { from: { x: 0, y: -1 }, to: { x: 0, y: 1 } },
      laterCrossing: { from: { x: 2, y: -1 }, to: { x: 2, y: 1 } },
      expectedMidpoint: { x: 2, y: 0 },
    },
    {
      name: "horizontal right-to-left",
      edge: { from: { x: 4, y: 0 }, to: { x: 0, y: 0 } },
      startContact: { from: { x: 4, y: -1 }, to: { x: 4, y: 1 } },
      laterCrossing: { from: { x: 2, y: -1 }, to: { x: 2, y: 1 } },
      expectedMidpoint: { x: 2, y: 0 },
    },
    {
      name: "vertical bottom-to-top",
      edge: { from: { x: 0, y: 0 }, to: { x: 0, y: 4 } },
      startContact: { from: { x: -1, y: 0 }, to: { x: 1, y: 0 } },
      laterCrossing: { from: { x: -1, y: 2 }, to: { x: 1, y: 2 } },
      expectedMidpoint: { x: 0, y: 2 },
    },
    {
      name: "vertical top-to-bottom",
      edge: { from: { x: 0, y: 4 }, to: { x: 0, y: 0 } },
      startContact: { from: { x: -1, y: 4 }, to: { x: 1, y: 4 } },
      laterCrossing: { from: { x: -1, y: 2 }, to: { x: 1, y: 2 } },
      expectedMidpoint: { x: 0, y: 2 },
    },
  ]

  for (const testCase of cases) {
    for (const otherEdges of [
      [testCase.startContact, testCase.laterCrossing],
      [testCase.laterCrossing, testCase.startContact],
    ]) {
      const segments = createSchematicTraceCrossingSegments({
        edges: [testCase.edge],
        otherEdges,
      })

      expect(segments).toHaveLength(3)

      const crossingSegments = segments.filter((segment) => segment.is_crossing)
      expect(crossingSegments).toHaveLength(1)

      const [crossingSegment] = crossingSegments
      const midpoint = {
        x: (crossingSegment.from.x + crossingSegment.to.x) / 2,
        y: (crossingSegment.from.y + crossingSegment.to.y) / 2,
      }

      expect(midpoint.x).toBeCloseTo(testCase.expectedMidpoint.x)
      expect(midpoint.y).toBeCloseTo(testCase.expectedMidpoint.y)
    }
  }
})
