import { test, expect } from "bun:test";
import { createSchematicTraceCrossingSegments } from "lib/components/primitive-components/Trace/trace-utils/create-schematic-trace-crossing-segments";
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg";

test("repro schematic trace crossing infinite loop", () => {
  const originalEdges = [
    { from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
    { from: { x: 1, y: 0 }, to: { x: 1, y: 3 } },
    { from: { x: 1, y: 3 }, to: { x: 5, y: 3 } },
    { from: { x: 5, y: 3 }, to: { x: 5, y: 2 } },
    { from: { x: 5, y: 2 }, to: { x: 0, y: 2 } },
    { from: { x: 0, y: 2 }, to: { x: 0, y: 0.5 } },
    { from: { x: 0, y: 0.5 }, to: { x: 2, y: 0.5 } },
  ];
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
  ];

  const edgesWithCrossings = createSchematicTraceCrossingSegments({
    edges: originalEdges,
    otherEdges: otherTraceEdges,
  });

  expect(
    convertCircuitJsonToSchematicSvg(
      [
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
  ).toMatchSvgSnapshot(import.meta.path);
});
