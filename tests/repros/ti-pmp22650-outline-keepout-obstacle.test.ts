import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbKeepoutOutline } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import pmp22650ArcCrop from "./assets/ti-pmp22650-imported-outline-keepout.circuit.json"

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

test.failing("PMP22650 outline keepout becomes SRJ obstacles", async () => {
  const circuitJson = pmp22650ArcCrop as AnyCircuitElement[]
  const keepout = circuitJson.find(
    (element): element is PcbKeepoutOutline =>
      element.type === "pcb_keepout" && element.shape === "outline",
  )
  if (!keepout) throw new Error("Missing PMP22650 outline keepout fixture")

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const keepoutObstacles = simpleRouteJson.obstacles.filter((obstacle) =>
    obstacle.obstacleId?.startsWith(keepout.pcb_keepout_id),
  )
  const sourceReference = {
    points: keepout.outline,
    strokeColor: "rgba(100, 100, 100, 0.45)",
    strokeWidth: keepout.stroke_width,
  }
  const sourceSvg = getSvgFromGraphicsObject({
    title: "PMP22650 Circuit JSON outline keepout",
    lines: [{ ...sourceReference, strokeColor: "#8b5cf6" }],
  })
  const srjSvg = getSvgFromGraphicsObject({
    title: "PMP22650 Simple Route JSON obstacles",
    lines: [sourceReference],
    rects: keepoutObstacles.map((obstacle) => ({
      ...obstacle,
      fill: "rgba(239, 68, 68, 0.65)",
      stroke: "#dc2626",
    })),
  })
  await expect(
    stackSvgsHorizontally(
      [
        labelPanel("Circuit JSON keepout", sourceSvg),
        labelPanel("Simple Route JSON obstacles", srjSvg),
      ],
      {
        gap: 16,
        normalizeSize: false,
        rootAttributes: { "data-testid": "pmp22650-keepout-srj-comparison" },
      },
    ),
  ).toMatchSvgSnapshot(import.meta.path)

  expect(keepout.outline).toHaveLength(49)
  expect(keepoutObstacles).toHaveLength(48)
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
