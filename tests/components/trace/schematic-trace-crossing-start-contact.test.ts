import { expect, test } from "bun:test"
import { createSchematicTraceCrossingSegments } from "lib/components/primitive-components/Trace/trace-utils/create-schematic-trace-crossing-segments"

test("createSchematicTraceCrossingSegments emits later crossings when a perpendicular edge meets edge.from", () => {
  const edges = [{ from: { x: 0, y: 0 }, to: { x: 10, y: 0 } }]
  const otherEdges = [0, 4, 7].map((x) => ({
    from: { x, y: -1 },
    to: { x, y: 1 },
  }))

  const result = createSchematicTraceCrossingSegments({ edges, otherEdges })
  const crossingSegments = result.filter((edge) => edge.is_crossing)

  expect(crossingSegments).toHaveLength(2)
  expect(
    (crossingSegments[0]!.from.x + crossingSegments[0]!.to.x) / 2,
  ).toBeCloseTo(4, 5)
  expect(
    (crossingSegments[1]!.from.x + crossingSegments[1]!.to.x) / 2,
  ).toBeCloseTo(7, 5)
  expect(result[0]!.from).toEqual({ x: 0, y: 0 })
  expect(result[result.length - 1]!.to).toEqual({ x: 10, y: 0 })
})

test("createSchematicTraceCrossingSegments preserves start-only contact with zero crossings and handles vertical edges", () => {
  const startOnlyResult = createSchematicTraceCrossingSegments({
    edges: [{ from: { x: 0, y: 0 }, to: { x: 10, y: 0 } }],
    otherEdges: [{ from: { x: 0, y: -1 }, to: { x: 0, y: 1 } }],
  })
  expect(startOnlyResult).toEqual([
    { from: { x: 0, y: 0 }, to: { x: 10, y: 0 } },
  ])

  const verticalResult = createSchematicTraceCrossingSegments({
    edges: [{ from: { x: 2, y: 10 }, to: { x: 2, y: 0 } }],
    otherEdges: [10, 6, 3].map((y) => ({
      from: { x: 0, y },
      to: { x: 4, y },
    })),
  })
  const verticalCrossings = verticalResult.filter((edge) => edge.is_crossing)
  expect(verticalCrossings).toHaveLength(2)
  expect(
    (verticalCrossings[0]!.from.y + verticalCrossings[0]!.to.y) / 2,
  ).toBeCloseTo(6, 5)
  expect(
    (verticalCrossings[1]!.from.y + verticalCrossings[1]!.to.y) / 2,
  ).toBeCloseTo(3, 5)
})
