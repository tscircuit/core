import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver } from "@tscircuit/capacity-autorouter"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createLabel = (title: string, detail: string) => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="800"
  height="72"
  viewBox="0 0 800 72"
>
  <rect width="800" height="72" fill="#172131" />
  <text x="20" y="29" fill="white" font-family="Arial, sans-serif" font-size="21" font-weight="bold">${title}</text>
  <text x="20" y="56" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="17">${detail}</text>
</svg>`

test("SRJ requests a route between terminals already joined by copper", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" routingDisabled>
      <net name="GND" />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0805"
        pcbX={-4}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0805"
        pcbX={4}
        connections={{ pin1: "net.GND" }}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const gndNet = circuit.db.source_net.list().find((net) => net.name === "GND")
  if (!gndNet) throw new Error("Expected the GND source net")

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const gndConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === gndNet.source_net_id,
  )
  if (!gndConnection) {
    throw new Error("Expected the GND SRJ connection")
  }
  if (gndConnection.pointsToConnect.length !== 2) {
    throw new Error("Expected exactly two GND terminals")
  }

  const [firstPoint, secondPoint] = gndConnection.pointsToConnect
  if (!firstPoint?.pointId || !secondPoint?.pointId) {
    throw new Error("Expected both GND terminals to have point IDs")
  }

  expect(gndConnection.externallyConnectedPointIds).toBeUndefined()

  expect(simpleRouteJson.traces ?? []).toHaveLength(0)
  const router = new AutoroutingPipelineSolver({
    ...simpleRouteJson,
    traces: [],
  })
  while (!router.srjWithPointPairs && !router.failed && !router.solved) {
    router.step()
  }
  expect(router.failed).toBe(false)
  const requestedRoutes = router.srjWithPointPairs!.connections
  expect(requestedRoutes).toHaveLength(1)

  const remainingRouteCount = requestedRoutes.length
  const pcbPanel = stackSvgsVertically(
    [
      createLabel(
        "Circuit JSON",
        "The top-layer GND pour already joins the two GND terminals",
      ),
      convertCircuitJsonToPcbSvg(circuitJson, {
        width: 800,
        height: 500,
        showPinNumbers: true,
      }),
    ],
    { gap: 0, normalizeSize: false },
  )
  const routingDemandPanel = stackSvgsVertically(
    [
      createLabel(
        "SRJ remaining routing demand",
        `${remainingRouteCount} ${remainingRouteCount === 1 ? "route" : "routes"} still requested between terminals already joined by copper`,
      ),
      getSvgFromGraphicsObject(
        {
          points: [
            { ...firstPoint, color: "#ff2ca8", label: "R1 GND" },
            { ...secondPoint, color: "#ff2ca8", label: "R2 GND" },
          ],
          lines: requestedRoutes.map((connection) => ({
            points: connection.pointsToConnect,
            strokeColor: "#ff2ca8",
            strokeWidth: 0.18,
            label: "unnecessary route request",
          })),
        },
        {
          backgroundColor: "#fff",
          svgWidth: 800,
          svgHeight: 500,
        },
      ),
    ],
    { gap: 0, normalizeSize: false },
  )

  await expect(
    stackSvgsHorizontally([pcbPanel, routingDemandPanel], {
      gap: 16,
      normalizeSize: false,
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
