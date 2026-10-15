import { expect, test } from "bun:test"
import { removeRedundantTracesToNetLabels } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/remove-redundant-traces-to-net-labels"

test("trim at an existing label connection while preserving other nets and disconnected routes", () => {
  const traces = [
    {
      subcircuit_connectivity_map_key: "ground",
      edges: [{ from: { x: 0, y: 2 }, to: { x: 0, y: -2 } }],
    },
    {
      subcircuit_connectivity_map_key: "ground",
      edges: [{ from: { x: 3, y: 2 }, to: { x: 3, y: 0 } }],
    },
    {
      subcircuit_connectivity_map_key: "signal",
      edges: [{ from: { x: -1, y: -1 }, to: { x: 1, y: -1 } }],
    },
  ]
  const retainedTraces = removeRedundantTracesToNetLabels({
    traces,
    existingTraces: [
      {
        subcircuit_connectivity_map_key: "ground",
        edges: [
          { from: { x: -1, y: 1 }, to: { x: 0, y: 1 } },
          { from: { x: 0, y: 1 }, to: { x: 0, y: 0 } },
        ],
      },
    ],
    netLabelTerminals: [
      { position: { x: 0, y: 0 }, connectivityKey: "ground" },
    ],
    terminals: [{ position: { x: 0, y: 2 }, connectivityKey: "ground" }],
  })

  expect(retainedTraces[0]!.edges).toEqual([
    { from: { x: 0, y: 2 }, to: { x: 0, y: 1 } },
  ])
  expect(retainedTraces.slice(1)).toEqual(traces.slice(1))
  expect(traces[0]!.edges[0]!.to).toEqual({ x: 0, y: -2 })
})
