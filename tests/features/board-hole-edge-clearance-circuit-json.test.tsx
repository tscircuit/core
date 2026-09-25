import { expect, test } from "bun:test"
import { type AnyCircuitElement, pcb_board } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board hole edge clearance survives Circuit JSON round trips and SRJ overrides", async () => {
  for (const clearance of [undefined, 0, 0.2]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={12} height={10} minTraceToHoleEdgeClearance={clearance}>
        <hole name="mount" diameter={2} />
        <pcbnotetext
          text={`Hole edge clearance: ${clearance ?? "unset"} mm`}
          pcbY={3}
          fontSize={0.4}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const exported: AnyCircuitElement[] = JSON.parse(
      JSON.stringify(circuit.getCircuitJson()),
    )
    const boardIndex = exported.findIndex(
      (element) => element.type === "pcb_board",
    )
    const board = pcb_board.parse(exported[boardIndex])
    exported[boardIndex] = board
    expect(board.min_trace_to_hole_edge_clearance).toBe(clearance)
    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: exported,
    })
    expect(simpleRouteJson.minTraceToHoleEdgeClearance).toBe(clearance)
    const overridden = getSimpleRouteJsonFromCircuitJson({
      circuitJson: exported,
      minTraceToHoleEdgeClearance: 0,
    }).simpleRouteJson
    expect(overridden.minTraceToHoleEdgeClearance).toBe(0)
    if (clearance === 0.2) expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
})
