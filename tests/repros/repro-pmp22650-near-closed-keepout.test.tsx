import { expect, test } from "bun:test"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pmp22650ArcStartDegrees = 14.0362434679
const pmp22650ArcEndDegrees = 5.7105931375 + 360
const pmp22650ArcPointCount = 48
const pmp22650ArcRadius = 0.254

const pmp22650NearClosedKeepoutOutline = Array.from(
  { length: pmp22650ArcPointCount },
  (_, outlinePointIndex) => {
    const angleDegrees =
      pmp22650ArcStartDegrees +
      ((pmp22650ArcEndDegrees - pmp22650ArcStartDegrees) * outlinePointIndex) /
        (pmp22650ArcPointCount - 1)
    const angleRadians = (angleDegrees * Math.PI) / 180

    return {
      x: pmp22650ArcRadius * Math.cos(angleRadians),
      y: pmp22650ArcRadius * Math.sin(angleRadians),
    }
  },
)

const createLabeledPanel = (label: string, svg: string) =>
  stackSvgsVertically(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="48" viewBox="0 0 800 48">
        <rect width="800" height="48" fill="#11161b" />
        <text x="400" y="31" fill="#e7edf2" font-family="Arial, sans-serif" font-size="18" font-weight="700" text-anchor="middle">${label}</text>
      </svg>`,
      svg,
    ],
    { gap: 0, normalizeSize: false },
  )

test("PMP22650 near-closed keepout uses native SRJ obstacles", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="1.5mm" height="1.5mm" layers={8} routingDisabled>
      <testpoint name="TP1" footprintVariant="pad" pcbX="-0.55mm" />
      <testpoint name="TP2" footprintVariant="pad" pcbX="0.55mm" />
      <pcbnotetext
        text="PMP22650 INNER4 NEAR-CLOSED KEEPOUT"
        pcbY="0.62mm"
        fontSize="0.08mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbBoard = circuit.db.pcb_board.list()[0]!
  circuit.db.pcb_keepout.insert({
    shape: "outline",
    outline: pmp22650NearClosedKeepoutOutline,
    stroke_width: 0.0254,
    layers: ["inner4"],
    subcircuit_id: pcbBoard.subcircuit_id,
    description: "PMP22650 Altium arc keepout",
  })

  const circuitJson = circuit.getCircuitJson()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const keepoutObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) => obstacle.connectedTo.length === 0,
  )

  expect(keepoutObstacles).toHaveLength(95)

  const comparisonSvg = stackSvgsHorizontally(
    [
      createLabeledPanel(
        "PMP22650 CIRCUIT JSON KEEPOUT",
        convertCircuitJsonToPcbSvg(circuitJson, {
          backgroundColor: "#11161b",
          includeVersion: false,
        }),
      ),
      createLabeledPanel(
        `${keepoutObstacles.length} SIMPLE ROUTE JSON OBSTACLES`,
        getSvgFromGraphicsObject(
          convertSrjToGraphicsObject(simpleRouteJson as any),
          {
            backgroundColor: "#11161b",
            hideInlineLabels: true,
          },
        ),
      ),
    ],
    { gap: 24, normalizeSize: true },
  )

  expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, undefined, {
    diffThresholdPercent: 0,
  })
})
