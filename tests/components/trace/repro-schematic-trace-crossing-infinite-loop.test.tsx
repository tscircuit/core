import { test, expect } from "bun:test"
import { createSchematicTraceCrossingSegments } from "lib/components/primitive-components/Trace/create-schematic-trace-crossing-segments"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

test("repro schematic trace crossing infinite loop", () => {
  const originalEdges = [
    { from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
    { from: { x: 1, y: 0 }, to: { x: 1, y: 3 } },
    { from: { x: 1, y: 3 }, to: { x: 5, y: 3 } },
    { from: { x: 5, y: 3 }, to: { x: 5, y: 2 } },
    { from: { x: 5, y: 2 }, to: { x: 0, y: 2 } },
    { from: { x: 0, y: 2 }, to: { x: 0, y: 0.5 } },
    { from: { x: 0, y: 0.5 }, to: { x: 2, y: 0.5 } },
  ]
  const otherTraceEdges = [
    { from: { x: 0, y: 1 }, to: { x: 1.5, y: 1 } },
    {
      from: { x: 1.5, y: 1 },
      to: { x: 1.5, y: 0 },
    },
    {
      from: { x: 1.5, y: 0 },
      to: { x: 0, y: 0 },
    },
  ]

  const edgesWithCrossings = createSchematicTraceCrossingSegments({
    edges: originalEdges,
    otherEdges: otherTraceEdges,
  })
  console.table(edgesWithCrossings)

  expect(
    convertCircuitJsonToSchematicSvg(
      [
        // {
        //   type: "schematic_trace",
        //   schematic_trace_id: "1",
        //   source_trace_id: "1",
        //   edges: originalEdges,
        //   junctions: [],
        // },
        {
          type: "schematic_trace",
          schematic_trace_id: "2",
          source_trace_id: "2",
          edges: otherTraceEdges,
          junctions: [],
        },
        {
          type: "schematic_trace",
          schematic_trace_id: "3",
          source_trace_id: "3",
          edges: edgesWithCrossings,
          junctions: [],
        },
      ],
      {
        grid: {
          cellSize: 1,
          labelCells: true,
        },
      },
    ),
  ).toMatchSvgSnapshot(import.meta.path)

  // expect(
  //   getSvgFromGraphicsObject({
  //     rects: edges.map((e) => ({
  //       center: { x: (e.from.x + e.to.x) / 2, y: (e.from.y + e.to.y) / 2 },
  //       width: Math.abs(e.from.x - e.to.x),
  //       height: Math.abs(e.from.y - e.to.y),
  //       fill: "red",
  //     })),
  //     // lines: [
  //     //   {
  //     //     points: edges.flatMap((e) => [
  //     //       { x: e.from.x, y: e.from.y },
  //     //       { x: e.to.x, y: e.to.y },
  //     //     ]),
  //     //   },
  //     //   {
  //     //     points: otherEdges.flatMap((e) => [
  //     //       { x: e.from.x, y: e.from.y },
  //     //       { x: e.to.x, y: e.to.y },
  //     //     ]),
  //     //   },
  //     // ],
  //   }),
  // ).toMatchSvgSnapshot(import.meta.path)
})
