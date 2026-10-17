import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported trace vias reuse their supplied physical via without hiding unrelated layers", async () => {
  const { circuit } = getTestFixture()
  const board = new Board({ width: 20, height: 10, layers: 4 })
  const primitives = createComponentsFromCircuitJson(
    { componentName: "", componentRotation: "0" },
    [
      {
        type: "pcb_trace",
        pcb_trace_id: "imported_trace",
        route: [
          {
            route_type: "via",
            x: -4,
            y: 0,
            from_layer: "bottom",
            to_layer: "inner1",
            outer_diameter: 2,
            hole_diameter: 1,
          },
          { route_type: "wire", x: -4, y: 0, layer: "bottom", width: 0.2 },
          { route_type: "wire", x: 4, y: 0, layer: "bottom", width: 0.2 },
          {
            route_type: "via",
            x: 4,
            y: 0,
            from_layer: "bottom",
            to_layer: "inner1",
            outer_diameter: 2,
            hole_diameter: 1,
          },
        ],
      },
      {
        type: "pcb_via",
        pcb_via_id: "supplied_via",
        pcb_trace_id: "imported_trace",
        x: -4,
        y: 0,
        layers: ["bottom", "inner2", "inner1"],
        outer_diameter: 2,
        hole_diameter: 1,
      },
      {
        type: "pcb_via",
        pcb_via_id: "unrelated_via",
        pcb_trace_id: "imported_trace",
        x: 4,
        y: 0,
        layers: ["top", "inner1"],
        outer_diameter: 2,
        hole_diameter: 1,
      },
    ],
  )
  for (const primitive of primitives) board.add(primitive)
  board.add(
    <pcbnotetext
      pcbX={-4}
      pcbY={2}
      layer="bottom"
      fontSize={0.5}
      text="SUPPLIED VIA: DRAW ONCE"
    />,
  )
  board.add(
    <pcbnotetext
      pcbX={4}
      pcbY={-2}
      layer="bottom"
      fontSize={0.5}
      text="GENERATED VIA: OTHER LAYERS RETAINED"
    />,
  )
  circuit.add(board)
  await circuit.renderUntilSettled()

  const pcbVias = circuit.db.pcb_via.list()
  expect(pcbVias).toHaveLength(3)
  expect(pcbVias.filter((via) => via.x === -4)).toHaveLength(1)
  expect(pcbVias.filter((via) => via.x === 4)).toHaveLength(2)
  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(
    pcbVias.find((via) => via.pcb_trace_id === pcbTrace.pcb_trace_id),
  ).toMatchObject({
    x: 4,
    outer_diameter: 2,
    hole_diameter: 1,
    layers: ["bottom", "inner2", "inner1"],
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
    showPcbNotes: true,
    shouldDrawErrors: false,
  })
})
