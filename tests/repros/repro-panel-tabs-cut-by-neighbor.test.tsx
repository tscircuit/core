import { beforeAll, expect, test } from "bun:test"
import { type CrossSection, getManifoldModule } from "@tscircuit/manifold-2d"
import { getPanelMaterial } from "tests/fixtures/get-panel-material"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyToPoint, scale } from "transformation-matrix"

const { circuit } = getTestFixture()
let material: CrossSection
// Circuit-world mm (+X right/+Y up) to SVG mm (+X right/+Y down).
const circuitWorldToSvgTransform = scale(1, -1)

beforeAll(async () => {
  // Board-world positions in mm, +X right, +Y up. The four neighbors have
  // edge midpoints offset by 7 mm from the center board's tab midpoints.
  circuit.add(
    <panel width={80} height={80} panelizationMethod="tab-routing">
      <board
        name="CENTER"
        width={20}
        height={20}
        pcbX={0}
        pcbY={0}
        routingDisabled
      />
      <board
        name="LEFT"
        width={20}
        height={34}
        pcbX={-22}
        pcbY={7}
        routingDisabled
      />
      <board
        name="RIGHT"
        width={20}
        height={34}
        pcbX={22}
        pcbY={-7}
        routingDisabled
      />
      <board
        name="TOP"
        width={34}
        height={20}
        pcbX={7}
        pcbY={22}
        routingDisabled
      />
      <board
        name="BOTTOM"
        width={34}
        height={20}
        pcbX={-7}
        pcbY={-22}
        routingDisabled
      />
    </panel>,
  )
  await circuit.renderUntilSettled()
  material = await getPanelMaterial({
    panel: circuit.db.pcb_panel.list()[0]!,
    cutouts: circuit.db.pcb_cutout.list(),
    holes: circuit.db.pcb_hole.list(),
  })

  // Show the actual substrate after every emitted slot and drill is removed.
  // Red islands have no connection to the outer frame. Keep snapshot failures
  // independent of the connectivity assertion so rendering errors stay visible.
  const regions = material.decompose().sort((a, b) => b.area() - a.area())
  const paths = regions
    .map((region, regionIndex) => {
      const path = region
        .toPolygons()
        .map((ring) => {
          const svgPositions = ring.map(([x, y]) =>
            applyToPoint(circuitWorldToSvgTransform, { x, y }),
          )
          return `M ${svgPositions.map(({ x, y }) => `${x},${y}`).join(" L ")} Z`
        })
        .join(" ")
      region.delete()
      return `<path d="${path}" fill="${regionIndex === 0 ? "#166534" : "#dc2626"}" fill-rule="evenodd"/>`
    })
    .join("")
  const labels = circuit.db.pcb_board
    .list()
    .map((board, boardIndex) => {
      const name = ["CENTER", "LEFT", "RIGHT", "TOP", "BOTTOM"][boardIndex]
      const svgPosition = applyToPoint(circuitWorldToSvgTransform, board.center)
      return `<text x="${svgPosition.x}" y="${svgPosition.y}" fill="white" font-size="2" text-anchor="middle" dominant-baseline="middle">${name}</text>`
    })
    .join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="880" viewBox="-42 -50 84 92"><rect x="-42" y="-50" width="84" height="92" fill="#f8fafc"/><text x="0" y="-46" text-anchor="middle" font-size="2.4">Offset tabs must remain connected to the frame</text><text x="0" y="-42.5" text-anchor="middle" font-size="1.8">Green: frame-connected material. Red: detached substrate.</text>${paths}${labels}</svg>`
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})

test("neighboring router slots preserve every board's connection to the panel frame", async () => {
  const { CrossSection } = await getManifoldModule()
  const regions = material.decompose().sort((a, b) => b.area() - a.area())
  const frame = regions[0]!
  try {
    for (const board of circuit.db.pcb_board.list()) {
      const center = CrossSection.square(1, true).translate(
        board.center.x,
        board.center.y,
      )
      const attachedCenter = frame.intersect(center)
      const attachedArea = attachedCenter.area()
      center.delete()
      attachedCenter.delete()
      expect(attachedArea).toBeCloseTo(1, 6)
    }
  } finally {
    for (const region of regions) region.delete()
    material.delete()
  }
})
