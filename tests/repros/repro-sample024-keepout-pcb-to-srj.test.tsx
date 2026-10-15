import { expect, test } from "bun:test"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { pcb_keepout_outline } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import keepoutData from "tests/fixtures/assets/sample024-open-keepouts.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createLabeledPanel = (label: string, svg: string) =>
  stackSvgsVertically(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="48" viewBox="0 0 800 48">
        <rect width="800" height="48" fill="#11161b" />
        <text x="400" y="31" fill="#e7edf2" font-family="Arial, sans-serif" font-size="18" text-anchor="middle">${label}</text>
      </svg>`,
      svg,
    ],
    { gap: 0, normalizeSize: false },
  )

test("Sample024's open inner4 arc expands to 286 SRJ obstacles", async () => {
  // Unmodified source records from dataset-srj24@6340ee4,
  // circuit-json/sample024-pmp22650-main.json. All positions are board-world
  // points in mm (+X right, +Y up, +Z toward the top layer; right-handed).
  // Center the small inspection board on the first real arc, without moving it.
  const keepout = pcb_keepout_outline.parse(keepoutData[0])
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={1}
      height={1}
      pcbX={135.89}
      pcbY={98.9584}
      layers={8}
      routingDisabled
    />,
  )
  await circuit.renderUntilSettled()
  circuit.db.pcb_keepout.insert({
    ...keepout,
    subcircuit_id: circuit.db.pcb_board.list()[0]!.subcircuit_id,
  })

  const circuitJson = circuit.getCircuitJson()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  expect(simpleRouteJson.obstacles).toHaveLength(286)
  for (const obstacle of simpleRouteJson.obstacles) {
    expect(obstacle.layers).toEqual(["inner4"])
    expect(obstacle.connectedTo).toEqual([])
  }

  const comparison = stackSvgsHorizontally(
    [
      createLabeledPanel(
        "SAMPLE024 SOURCE PCB / INNER4 OPEN ARC",
        convertCircuitJsonToPcbSvg(circuitJson, {
          layer: "inner4",
          width: 800,
          height: 600,
          backgroundColor: "#11161b",
          includeVersion: false,
          shouldDrawRatsNest: false,
          viewport: {
            minX: 135.89 - 0.32,
            maxX: 135.89 + 0.32,
            minY: 98.9584 - 0.32,
            maxY: 98.9584 + 0.32,
          },
        }),
      ),
      createLabeledPanel(
        `${simpleRouteJson.obstacles.length} SIMPLE ROUTE JSON OBSTACLES`,
        getSvgFromGraphicsObject(
          convertSrjToGraphicsObject({
            bounds: simpleRouteJson.bounds,
            layerCount: simpleRouteJson.layerCount,
            minTraceWidth: simpleRouteJson.minTraceWidth,
            obstacles: simpleRouteJson.obstacles,
            connections: simpleRouteJson.connections,
          }),
          {
            svgWidth: 800,
            svgHeight: 600,
            backgroundColor: "#11161b",
            hideInlineLabels: true,
          },
        ),
      ),
    ],
    { gap: 24, normalizeSize: false },
  ).replace(/[ \t]+$/gm, "")

  await expect(comparison).toMatchSvgSnapshot(import.meta.path)
})
