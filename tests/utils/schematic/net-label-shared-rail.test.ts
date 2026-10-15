import { expect, test } from "bun:test"
import { removeRedundantTracesToNetLabels } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/remove-redundant-traces-to-net-labels"

test("a branch retains the shared rail it needs even when both rail pins have labels", () => {
  const retainedTraces = removeRedundantTracesToNetLabels({
    traces: [
      {
        subcircuit_connectivity_map_key: "ground",
        edges: [{ from: { x: -2, y: 0 }, to: { x: 2, y: 0 } }],
      },
      {
        subcircuit_connectivity_map_key: "ground",
        edges: [{ from: { x: 0, y: 1 }, to: { x: 0, y: 0 } }],
      },
    ],
    existingTraces: [-2, 2].map((x) => ({
      subcircuit_connectivity_map_key: "ground",
      edges: [{ from: { x, y: 1 }, to: { x, y: -1 } }],
    })),
    netLabelTerminals: [-2, 2].map((x) => ({
      position: { x, y: -1 },
      connectivityKey: "ground",
    })),
    terminals: [-2, 0, 2].map((x) => ({
      position: { x, y: 1 },
      connectivityKey: "ground",
    })),
  })

  expect(retainedTraces.map((trace) => trace.edges)).toEqual([
    [{ from: { x: -2, y: 0 }, to: { x: 0, y: 0 } }],
    [{ from: { x: 0, y: 1 }, to: { x: 0, y: 0 } }],
  ])
})
