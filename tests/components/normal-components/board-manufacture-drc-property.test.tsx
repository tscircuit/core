import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("board manufacture DRC properties are set correctly", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      height={20}
      minTraceWidth={0.3}
      minViaHoleDiameter={0.2}
      minViaPadDiameter={0.3}
      minViaHoleEdgeToViaHoleEdgeClearance={0.15}
      minTraceToPadEdgeClearance={0.1}
      minPadEdgeToPadEdgeClearance={0.1}
      minPlatedHoleDrillEdgeToDrillEdgeClearance={0.2}
      minViaEdgeToPadEdgeClearance={0.1}
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={5} pcbY={5} />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={5}
        pcbY={15}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.min_trace_width).toBe(0.3)
  expect(pcb_board.min_via_hole_diameter).toBe(0.2)
  expect(pcb_board.min_via_pad_diameter).toBe(0.3)
  expect(pcb_board.min_via_hole_edge_to_via_hole_edge_clearance).toBe(0.15)
  expect(pcb_board.min_trace_to_pad_edge_clearance).toBe(0.1)
  expect(pcb_board.min_pad_edge_to_pad_edge_clearance).toBe(0.1)
  expect(pcb_board.min_plated_hole_drill_edge_to_drill_edge_clearance).toBe(0.2)
  expect(pcb_board.min_via_edge_to_pad_edge_clearance).toBe(0.1)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  expect(simpleRouteJson.minTraceWidth).toBe(0.3)
  expect(simpleRouteJson.minTraceToPadEdgeClearance).toBe(0.1)
  expect(simpleRouteJson.minViaEdgeToPadEdgeClearance).toBe(0.1)

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  const routeWireWidths = pcbTrace.route
    .filter((point) => point.route_type === "wire")
    .map((point) => point.width)
  expect(routeWireWidths).toEqual([0.3, 0.3])

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
