import { expect, test } from "bun:test"
import { removeRedundantTracesToNetLabels } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/remove-redundant-traces-to-net-labels"

test("preserve a branch beyond a fixed label and a solver label connector", () => {
  const retainedTraces = removeRedundantTracesToNetLabels({
    traces: [
      {
        subcircuit_connectivity_map_key: "ground",
        edges: [{ from: { x: 0, y: 2 }, to: { x: 0, y: -2 } }],
      },
      {
        subcircuit_connectivity_map_key: "ground",
        edges: [{ from: { x: 1, y: -1 }, to: { x: 0, y: -1 } }],
      },
      {
        subcircuit_connectivity_map_key: "ground",
        edges: [{ from: { x: 0, y: 1.5 }, to: { x: -1, y: 1.5 } }],
      },
    ],
    existingTraces: [
      {
        subcircuit_connectivity_map_key: "ground",
        edges: [{ from: { x: -1, y: 0 }, to: { x: 0, y: 0 } }],
      },
    ],
    netLabelTerminals: [
      { position: { x: -1, y: 0 }, connectivityKey: "ground" },
    ],
    terminals: [
      { position: { x: 0, y: 2 }, connectivityKey: "ground" },
      { position: { x: 1, y: -1 }, connectivityKey: "ground" },
      { position: { x: -1, y: 1.5 }, connectivityKey: "ground" },
    ],
  })

  expect(retainedTraces.map((trace) => trace.edges)).toEqual([
    [{ from: { x: 0, y: 2 }, to: { x: 0, y: -1 } }],
    [{ from: { x: 1, y: -1 }, to: { x: 0, y: -1 } }],
    [{ from: { x: 0, y: 1.5 }, to: { x: -1, y: 1.5 } }],
  ])
})
