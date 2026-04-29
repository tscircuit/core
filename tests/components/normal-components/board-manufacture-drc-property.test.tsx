import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("board manufacture DRC properties are set correctly", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      height={20}
      minTraceWidth={0.2}
      minViaHoleDiameter={0.2}
      minViaPadDiameter={0.3}
      minViaHoleEdgeToViaHoleEdgeClearance={0.15}
      minTraceToPadEdgeClearance={0.1}
      minPadEdgeToPadEdgeClearance={0.1}
      minPlatedHoleDrillEdgeToDrillEdgeClearance={0.2}
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={5} pcbY={5} />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.min_trace_width).toBe(0.2)
  expect(pcb_board.min_via_hole_diameter).toBe(0.2)
  expect(pcb_board.min_via_pad_diameter).toBe(0.3)
  expect(pcb_board.min_via_hole_edge_to_via_hole_edge_clearance).toBe(0.15)
  expect(pcb_board.min_trace_to_pad_edge_clearance).toBe(0.1)
  expect(pcb_board.min_pad_edge_to_pad_edge_clearance).toBe(0.1)
  expect(pcb_board.min_plated_hole_drill_edge_to_drill_edge_clearance).toBe(0.2)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  expect(simpleRouteJson.minTraceWidth).toBe(0.2)
})
