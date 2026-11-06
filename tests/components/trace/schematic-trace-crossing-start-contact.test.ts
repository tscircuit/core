import { expect, test } from "bun:test"
import { createSchematicTraceCrossingSegments } from "lib/components/primitive-components/Trace/trace-utils/create-schematic-trace-crossing-segments"

test("createSchematicTraceCrossingSegments preserves later crossings after a start contact", () => {
  const baseEdges = [{ from: { x: 0, y: 0 }, to: { x: 10, y: 0 } }]
  const baseOtherEdges = [0, 4, 7].map((x) => ({
    from: { x, y: -1 },
    to: { x, y: 1 },
  }))

  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ]) {
    const rotate = ({ x, y }: { x: number; y: number }) => ({
      x: x * dx - y * dy,
      y: x * dy + y * dx,
    })

    const edges = baseEdges.map(({ from, to }) => ({
      from: rotate(from),
      to: rotate(to),
    }))
    const rotatedOthers = baseOtherEdges.map(({ from, to }) => ({
      from: rotate(from),
      to: rotate(to),
    }))

    for (const candidateOrder of [
      rotatedOthers,
      [...rotatedOthers].reverse(),
    ]) {
      const result = createSchematicTraceCrossingSegments({
        edges,
        otherEdges: candidateOrder,
      })

      const crossings = result.filter((edge) => edge.is_crossing)
      expect(crossings).toHaveLength(2)

      // Verify segment continuity from original start to original end
      expect(result[0].from).toEqual(edges[0].from)
      expect(result[result.length - 1].to).toEqual(edges[0].to)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].to.x).toBeCloseTo(result[i + 1].from.x)
        expect(result[i].to.y).toBeCloseTo(result[i + 1].from.y)
      }
    }
  }
})

test("createSchematicTraceCrossingSegments emits no crossing when only a start contact is present", () => {
  const edges = [{ from: { x: 0, y: 0 }, to: { x: 10, y: 0 } }]
  const otherEdges = [{ from: { x: 0, y: -1 }, to: { x: 0, y: 1 } }]

  const result = createSchematicTraceCrossingSegments({
    edges,
    otherEdges,
  })

  expect(result).toEqual(edges)
  expect(result.filter((edge) => edge.is_crossing)).toHaveLength(0)
})
