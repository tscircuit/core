import "bun-match-svg"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pmp22650CutoutCenter = { x: 96.08639914, y: 102.73279936 }

// Exact board-world mm points from PMP22650's pcb_cutout_altium_23,
// translated into the cutout's local, right-handed XY frame for TSX input.
const pmp22650CutoutPoints = [
  { x: -12.5000004, y: -15.00000048 },
  { x: 12.5000004, y: -15.00000048 },
  { x: 12.5000004, y: 15.00000048 },
  { x: -12.5000004, y: 15.00000048 },
  { x: -12.5000004, y: -15.00000048 },
]

const createLabeledPanel = (label: string, svg: string): string =>
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

test("PMP22650 polygon cutout is fragmented into scanline obstacles", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={30}
      height={35}
      pcbX={pmp22650CutoutCenter.x}
      pcbY={pmp22650CutoutCenter.y}
      layers={8}
      routingDisabled
    >
      <cutout shape="polygon" points={pmp22650CutoutPoints} />
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  expect(simpleRouteJson.obstacles).toHaveLength(50)

  const comparison = stackSvgsHorizontally(
    [
      createLabeledPanel(
        "PMP22650 POLYGON CUTOUT",
        convertCircuitJsonToPcbSvg(circuitJson, {
          layer: "top",
          width: 800,
          height: 600,
          backgroundColor: "#11161b",
          includeVersion: false,
          shouldDrawRatsNest: false,
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
            connections: [],
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
