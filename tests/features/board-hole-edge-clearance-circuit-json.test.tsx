import { expect, test } from "bun:test"
import { type AnyCircuitElement, pcb_board } from "circuit-json"
import { Group_applyDrcTolerancesToSimpleRouteJson } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board hole edge clearance persists into SRJ with NPTH geometry and phase overrides", async () => {
  for (const [clearance, expected] of [
    [undefined, 0.2],
    [0, 0],
    [0.2, 0.2],
    [0.4, 0.4],
  ] as const) {
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
    expect(board.min_trace_to_hole_edge_clearance).toBe(expected)
    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      circuitJson: exported,
    })
    expect(simpleRouteJson.minTraceToHoleEdgeClearance).toBe(expected)
    const hole = circuit.db.pcb_hole.list()[0]!
    expect(
      simpleRouteJson.obstacles.find((obstacle) => obstacle.isNonPlatedHole),
    ).toMatchObject({
      obstacleId: hole.pcb_hole_id,
      shape: "circle",
      width: 2,
      height: 2,
      connectedTo: [],
      layers: ["top", "bottom"],
    })
    for (const phaseClearance of [0, 0.5]) {
      const phaseInput = Group_applyDrcTolerancesToSimpleRouteJson(
        simpleRouteJson,
        {
          minTraceToHoleEdgeClearance: phaseClearance,
          minTraceToPadEdgeClearance: phaseClearance,
        },
      )
      expect(phaseInput.minTraceToHoleEdgeClearance).toBe(phaseClearance)
      expect(phaseInput.minTraceToPadEdgeClearance).toBe(phaseClearance)
    }
    expect(simpleRouteJson.minTraceToHoleEdgeClearance).toBe(expected)
    const overridden = getSimpleRouteJsonFromCircuitJson({
      circuitJson: exported,
      minTraceToHoleEdgeClearance: 0,
    }).simpleRouteJson
    expect(overridden.minTraceToHoleEdgeClearance).toBe(0)
    if (clearance === 0.2) expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
})
