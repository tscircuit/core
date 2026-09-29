import { expect, test } from "bun:test"
import type {
  AnyCircuitElement,
  PcbKeepoutOutline,
  PcbNotePath,
  PcbSmtPadCircle,
} from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import tmds62levmKeepoutCrop from "./assets/ti-tmds62levm-imported-outline-keepout.circuit.json"

const labelSvg = (
  label: string,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="36">
  <rect width="800" height="36" fill="#121212" />
  <text x="400" y="23" fill="#f4f4f4" font-family="Arial, sans-serif" font-size="18" font-weight="700" text-anchor="middle">${label}</text>
</svg>`

const labelPanel = (label: string, svg: string) =>
  stackSvgsVertically([labelSvg(label), svg], {
    gap: 0,
    normalizeSize: false,
  })

test("TMDS62LEVM outline keepout becomes SRJ obstacles", async () => {
  const circuitJson = tmds62levmKeepoutCrop as AnyCircuitElement[]
  const keepout = circuitJson.find(
    (element): element is PcbKeepoutOutline =>
      element.type === "pcb_keepout" && element.shape === "outline",
  )
  if (!keepout) throw new Error("Missing TMDS62LEVM outline keepout fixture")
  const enclosedPad = circuitJson.find(
    (element): element is PcbSmtPadCircle =>
      element.type === "pcb_smtpad" &&
      element.pcb_smtpad_id === "pcb_smtpad_altium_120627" &&
      element.shape === "circle",
  )
  if (!enclosedPad) throw new Error("Missing enclosed TMDS62LEVM pad")

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const keepoutObstacles = simpleRouteJson.obstacles.filter((obstacle) =>
    obstacle.obstacleId?.startsWith(keepout.pcb_keepout_id),
  )
  const keepoutSnapshotHighlight: PcbNotePath = {
    type: "pcb_note_path",
    pcb_note_path_id: "pcb_note_path_tmds62levm_keepout_highlight",
    route: [...keepout.outline, keepout.outline[1]!],
    layer: "top",
    stroke_width: keepout.stroke_width,
    color: "rgba(255, 107, 107, 0.45)",
  }
  const sourceSvg = convertCircuitJsonToPcbSvg(
    [
      ...circuitJson.filter((element) => element !== keepout),
      keepoutSnapshotHighlight,
    ],
    {
      width: 800,
      height: 640,
      layer: "top",
      viewport: {
        minX: 3.5,
        minY: 118,
        maxX: 12.5,
        maxY: 127.5,
      },
    },
  )
  const otherTopLayerObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) =>
      obstacle.layers.includes("top") &&
      !obstacle.obstacleId?.startsWith(keepout.pcb_keepout_id),
  )
  const srjSvg = getSvgFromGraphicsObject({
    title: "TMDS62LEVM SRJ rect obstacles (no source overlay)",
    lines: [],
    rects: [
      ...otherTopLayerObstacles.map((obstacle) => ({
        ...obstacle,
        fill: "rgba(59, 130, 246, 0.3)",
        stroke: "#2563eb",
      })),
      ...keepoutObstacles.map((obstacle, index) => ({
        ...obstacle,
        fill:
          index % 2 === 0
            ? "rgba(239, 68, 68, 0.45)"
            : "rgba(249, 115, 22, 0.45)",
        stroke: index % 2 === 0 ? "#dc2626" : "#ea580c",
      })),
    ],
  })
  await expect(
    stackSvgsHorizontally(
      [
        labelPanel("Real TMDS62LEVM Altium board crop", sourceSvg),
        labelPanel("Simple Route JSON rect obstacles only", srjSvg),
      ],
      {
        gap: 16,
        normalizeSize: false,
        rootAttributes: {
          "data-testid": "tmds62levm-keepout-srj-comparison",
        },
      },
    ),
  ).toMatchSvgSnapshot(import.meta.path, undefined, {
    diffThresholdPercent: 0,
  })

  expect(keepout.outline).toHaveLength(49)
  const keepoutXs = keepout.outline.map((point) => point.x)
  const keepoutOuterDiameter =
    Math.max(...keepoutXs) - Math.min(...keepoutXs) + keepout.stroke_width
  expect(keepoutOuterDiameter).toBeGreaterThan(enclosedPad.radius * 2)
  expect(keepoutObstacles).toHaveLength(48)
  expect(keepoutObstacles[0]?.obstacleId).toBe(
    `${keepout.pcb_keepout_id}_segment_0`,
  )
  expect(
    keepoutObstacles.every(
      (obstacle) =>
        obstacle.type === "rect" &&
        obstacle.height === keepout.stroke_width &&
        obstacle.layers.length === 1 &&
        obstacle.layers[0] === "top" &&
        obstacle.connectedTo.length === 0,
    ),
  ).toBe(true)
})
