import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const footprint: AnyCircuitElement[] = [
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "",
    pcb_component_id: "",
    shape: "circle",
    x: 0,
    y: 0,
    radius: 0.2,
    layer: "top",
    port_hints: ["1"],
  },
  {
    type: "pcb_keepout",
    pcb_keepout_id: "",
    shape: "rect",
    center: { x: 0, y: 0 },
    width: 4,
    height: 2,
    layers: ["top", "bottom", "inner1"],
    allow_traces: false,
    allow_placements: false,
    warning_only: true,
  },
  {
    type: "pcb_keepout",
    pcb_keepout_id: "",
    shape: "circle",
    center: { x: 5, y: 0 },
    radius: 1,
    layers: ["bottom"],
    allow_traces: true,
    allow_placements: false,
    warning_only: false,
  },
]

test("flipped imported keepouts preserve permissions and layer collections", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={22} height={12} schematicDisabled autorouter="none">
      <chip
        name="J1"
        footprint={footprint}
        layer="bottom"
        pcbRotation={90}
        cadModel={null}
      />
      <keepout
        shape="rect"
        width={2}
        height={1}
        pcbX={-7}
        layer="bottom"
        allowTraces={false}
        allowPlacements
        warningOnly={false}
      />
      <pcbnotetext
        text="bottom component: layers flip, permissions stay"
        pcbX={0}
        pcbY={-4}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const keepouts = circuit.db.pcb_keepout.list()
  expect(keepouts).toMatchObject([
    {
      shape: "rect",
      layers: ["bottom", "top", "inner1"],
      allow_traces: false,
      allow_placements: false,
      warning_only: true,
    },
    {
      shape: "circle",
      layers: ["top"],
      allow_traces: true,
      allow_placements: false,
      warning_only: false,
    },
    {
      shape: "rect",
      layers: ["bottom"],
      allow_traces: false,
      allow_placements: true,
      warning_only: false,
    },
  ])
  // Advisory and trace-permitted shapes stay absent from routing obstacles.
  expect(getObstaclesFromCircuitJson(keepouts)).toMatchObject([
    { layers: ["bottom"], center: { x: -7, y: 0 }, width: 2, height: 1 },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
