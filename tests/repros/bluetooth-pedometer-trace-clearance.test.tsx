import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import fixture from "../assets/bluetooth-pedometer.unrouted.circuit.json"

test("Bluetooth pedometer loses its requested trace clearance before routing", async () => {
  // Real board: https://tscircuit.com/techmannih/Bluetooth-pedometer
  // Source commit: ebe6cfad63786434183a4ec6709409ade261dfff.
  // Exported after removing manual routing; PCB/source geometry is retained.
  // Render the board rules independently, then use the frozen real component
  // geometry for SRJ export. This avoids unrelated crystal-inflator/preflight bugs.
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={46.6}
      height={32}
      layers={4}
      routingDisabled
      schematicDisabled
      minTraceToPadEdgeClearance="0.05mm"
      autorouter={{ traceClearance: "0.1mm" }}
    />,
  )
  await circuit.renderUntilSettled()
  const board = circuit.db.pcb_board.list()[0]!
  const circuitJson = (structuredClone(fixture) as AnyCircuitElement[]).map(
    (element): AnyCircuitElement =>
      element.type === "pcb_board"
        ? {
            ...element,
            min_trace_to_pad_edge_clearance:
              board.min_trace_to_pad_edge_clearance,
            min_different_net_trace_edge_to_trace_edge_clearance:
              board.min_different_net_trace_edge_to_trace_edge_clearance,
          }
        : element,
  )
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  expect(
    circuitJson.filter((element) => element.type === "pcb_component"),
  ).toHaveLength(61)
  expect(
    circuitJson.filter((element) => element.type === "pcb_trace"),
  ).toHaveLength(0)
  expect(
    board.min_different_net_trace_edge_to_trace_edge_clearance,
  ).toBeUndefined()
  expect(simpleRouteJson).not.toHaveProperty(
    "minDifferentNetTraceEdgeToTraceEdgeClearance",
  )
  expect(simpleRouteJson.minTraceToPadEdgeClearance).toBe(0.05)
  circuitJson.push({
    type: "pcb_note_text",
    pcb_note_text_id: "pedometer_clearance_label",
    text: `Bluetooth pedometer: requested trace 0.1 mm, emitted ${board.min_different_net_trace_edge_to_trace_edge_clearance ?? "missing"}; pad 0.05 mm`,
    anchor_position: { x: 0, y: 18 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 0.65,
    layer: "top",
  })
  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
