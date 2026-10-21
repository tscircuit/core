import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver } from "@tscircuit/capacity-autorouter"
import type { PcbNotePath } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getCopperPourTerminalsFixture } from "./fixtures/copper-pour-terminals.fixture"

test("only the terminal outside the copper pour needs routing", async () => {
  const circuit = await getCopperPourTerminalsFixture()
  const circuitJson = circuit.getCircuitJson()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const gndConnection = simpleRouteJson.connections[0]!
  expect(gndConnection.pointsToConnect).toHaveLength(3)
  expect(gndConnection.externallyConnectedPointIds).toEqual([
    gndConnection.pointsToConnect
      .filter((point) => point.x <= 0)
      .map((point) => point.pointId!),
  ])

  expect(simpleRouteJson.traces ?? []).toHaveLength(0)
  const router = new AutoroutingPipelineSolver({
    ...simpleRouteJson,
    traces: [],
  })
  while (!router.srjWithPointPairs && !router.failed && !router.solved) {
    router.step()
  }
  expect(router.failed).toBe(false)
  expect(router.srjWithPointPairs!.connections).toHaveLength(1)

  // Draw the actual router's requested point pairs over the original copper.
  const requestedRoutes: PcbNotePath[] =
    router.srjWithPointPairs!.connections.map((connection, index) => ({
      type: "pcb_note_path",
      pcb_note_path_id: `requested_route_${index}`,
      route: connection.pointsToConnect.map(({ x, y }) => ({ x, y })),
      layer: "top",
      stroke_width: 0.1,
      color: "#00d4ff",
    }))
  await expect(
    convertCircuitJsonToPcbSvg([
      ...circuitJson,
      ...requestedRoutes,
      {
        type: "pcb_note_text",
        pcb_note_text_id: "requested_routes_legend",
        text: `CYAN = ${requestedRoutes.length} SRJ route ${requestedRoutes.length === 1 ? "pair" : "pairs"} requested`,
        anchor_position: { x: 0, y: -2.8 },
        anchor_alignment: "center",
        font: "tscircuit2024",
        font_size: 0.5,
        layer: "top",
      },
    ]),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
