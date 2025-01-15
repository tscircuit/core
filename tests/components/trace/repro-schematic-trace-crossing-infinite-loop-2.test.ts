import { test, expect } from "bun:test"
import { createSchematicTraceCrossingSegments } from "lib/components/primitive-components/Trace/create-schematic-trace-crossing-segments"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

// Reproduction created from debugger inside snippet-import1-contribution-board.test.tsx

test("repro schematic trace crossing infinite loop 2", () => {
  const inputEdges = [
    {
      from: { route_type: "wire", x: -3.3, y: 11.1, width: 0.1, layer: "top" },
      to: {
        route_type: "wire",
        x: -3.3,
        y: -0.5999999999999996,
        width: 0.1,
        layer: "top",
      },
    },
  ]

  const otherEdges = [
    {
      from: { route_type: "wire", x: -5.95, y: 0.1, layer: "top", width: 0.1 },
      to: {
        route_type: "wire",
        x: 2.9,
        y: -0.8000000000000007,
        layer: "top",
        width: 0.1,
      },
    },
  ]

  // Try with increasing number of otherEdges until we hit an error
  const edgesWithCrossings = createSchematicTraceCrossingSegments({
    edges: inputEdges,
    otherEdges: otherEdges,
  })
})
