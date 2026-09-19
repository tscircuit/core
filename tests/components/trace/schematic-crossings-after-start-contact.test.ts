import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { createSchematicTraceCrossingSegments } from "lib/components/primitive-components/Trace/trace-utils/create-schematic-trace-crossing-segments"

test("a start contact does not hide later schematic wire crossings", async () => {
  const originalEdges = [{ from: { x: 0, y: 0 }, to: { x: 10, y: 0 } }]
  const otherEdges = [0, 4, 7].map((x) => ({
    from: { x, y: -1 },
    to: { x, y: 1 },
  }))

  // Rotate the input to cover horizontal/vertical wires in both directions.
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ]) {
    const transform = ({ x, y }: { x: number; y: number }) => ({
      x: x * dx - y * dy,
      y: x * dy + y * dx,
    })
    const edges = originalEdges.map(({ from, to }) => ({
      from: transform(from),
      to: transform(to),
    }))
    const transformedOtherEdges = otherEdges.map(({ from, to }) => ({
      from: transform(from),
      to: transform(to),
    }))

    for (const candidates of [
      transformedOtherEdges,
      [...transformedOtherEdges].reverse(),
    ]) {
      const result = createSchematicTraceCrossingSegments({
        edges,
        otherEdges: candidates,
      })
      const crossings = result.filter((edge) => edge.is_crossing)
      expect(crossings).toHaveLength(2)
      for (const [index, crossing] of crossings.entries()) {
        expect((crossing.from.x + crossing.to.x) / 2).toBeCloseTo(
          [4, 7][index] * dx,
        )
        expect((crossing.from.y + crossing.to.y) / 2).toBeCloseTo(
          [4, 7][index] * dy,
        )
      }
      expect(result[0].from).toEqual(edges[0].from)
      expect(result.at(-1)?.to).toEqual(edges[0].to)
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].to).toEqual(result[i].from)
      }
    }
  }

  const edges = createSchematicTraceCrossingSegments({
    edges: originalEdges,
    otherEdges,
  })
  expect(
    createSchematicTraceCrossingSegments({
      edges: originalEdges,
      otherEdges: [otherEdges[0]],
    }),
  ).toEqual(originalEdges)
  const svg = convertCircuitJsonToSchematicSvg(
    [
      {
        type: "schematic_text",
        schematic_text_id: "title",
        text: "Start contact at x=0; crossings preserved at x=4 and x=7",
        position: { x: 0, y: 2 },
        anchor: "left",
        font_size: 0.23,
        rotation: 0,
        color: "black",
      },
      ...otherEdges.map((edge, index) => ({
        type: "schematic_trace" as const,
        schematic_trace_id: `other_${index}`,
        edges: [edge],
        junctions: [],
      })),
      {
        type: "schematic_trace",
        schematic_trace_id: "wire",
        edges,
        junctions: [],
      },
    ],
    { grid: { cellSize: 1, labelCells: true } },
  )
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
