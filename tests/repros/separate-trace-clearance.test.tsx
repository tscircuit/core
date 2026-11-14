import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("preserve independent trace and pad clearances before routing", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={12}
      height={5}
      routingDisabled
      minTraceToPadEdgeClearance="0.05mm"
      autorouter={{ traceClearance: "0.1mm" }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <pcbnotetext
        text="Requested: trace / trace 0.1 mm; pad / trace 0.05 mm"
        pcbY={1.6}
        fontSize={0.25}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.db.pcb_board.list()[0]!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })
  expect(board.min_different_net_trace_edge_to_trace_edge_clearance).toBe(0.1)
  expect(simpleRouteJson.minDifferentNetTraceEdgeToTraceEdgeClearance).toBe(0.1)
  expect(simpleRouteJson.minTraceToPadEdgeClearance).toBe(0.05)
  circuit.db.pcb_note_text.insert({
    text: `Emitted trace / trace: ${board.min_different_net_trace_edge_to_trace_edge_clearance ?? "missing"}`,
    anchor_position: { x: 0, y: -1.6 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 0.25,
    layer: "top",
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
