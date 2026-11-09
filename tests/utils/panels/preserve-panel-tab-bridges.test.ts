import { expect, test } from "bun:test"
import { Polygon, point } from "@flatten-js/core"
import { type Vec2, getManifoldModule } from "@tscircuit/manifold-2d"
import type { PcbCutoutRect, PcbPanel } from "circuit-json"
import { preservePanelTabBridges } from "lib/utils/panels/preserve-panel-tab-bridges"
import { getPanelMaterial } from "tests/fixtures/get-panel-material"
import {
  applyToPoint,
  compose,
  rotateDEG,
  scale,
  translate,
} from "transformation-matrix"

test("rotated rounded slots preserve enclosed bridges without changing unrelated slots", async () => {
  const panel: PcbPanel = {
    type: "pcb_panel",
    pcb_panel_id: "panel",
    center: { x: 0, y: 0 },
    width: 120,
    height: 100,
    thickness: 1.6,
    covered_with_solder_mask: true,
  }
  const slot: PcbCutoutRect = {
    type: "pcb_cutout",
    pcb_cutout_id: "rounded_slot",
    shape: "rect",
    center: { x: 30, y: 20 },
    width: 20,
    height: 6,
    corner_radius: 3,
    rotation: 37,
  }
  const separateSlot: PcbCutoutRect = {
    type: "pcb_cutout",
    pcb_cutout_id: "separate_slot",
    shape: "rect",
    center: { x: -30, y: -20 },
    width: 20,
    height: 6,
    corner_radius: 3,
  }
  const cutoutLocalToCircuitWorldTransform = compose(
    translate(slot.center.x, slot.center.y),
    rotateDEG(slot.rotation!),
  )
  const bridge = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
  ].map((position) =>
    applyToPoint(cutoutLocalToCircuitWorldTransform, position),
  )
  const original = structuredClone([slot, separateSlot])
  const protectedSlots = preservePanelTabBridges([slot, separateSlot], [bridge])
  expect([slot, separateSlot]).toEqual(original)
  expect(protectedSlots.at(-1)).toBe(separateSlot)
  const changedSlots = protectedSlots.slice(0, -1)
  expect(changedSlots.length).toBeGreaterThan(1)
  for (const cutout of changedSlots) {
    expect(cutout.shape).toBe("polygon")
    if (cutout.shape === "polygon") {
      expect(
        new Polygon(cutout.points.map(({ x, y }) => point(x, y))).isValid(),
      ).toBe(true)
    }
  }
  const { CrossSection } = await getManifoldModule()
  const before = await getPanelMaterial({ panel, cutouts: original, holes: [] })
  const after = await getPanelMaterial({
    panel,
    cutouts: protectedSlots,
    holes: [],
  })
  const bridgeSection = CrossSection.ofPolygons([
    bridge.map(({ x, y }): Vec2 => [x, y]),
  ])
  const bridgeMaterial = after.intersect(bridgeSection)
  expect(bridgeMaterial.area()).toBeCloseTo(4, 6)
  // Only the 4 mm² bridge is added, allowing for rounded-cap tessellation.
  expect(Math.abs(after.area() - before.area() - 4)).toBeLessThan(0.02)
  const extraRouting = before.subtract(after)
  expect(extraRouting.area()).toBeLessThan(0.02)
  // Circuit-world mm (+X right/+Y up) to SVG mm (+X right/+Y down).
  const circuitWorldToSvgTransform = scale(1, -1)
  const path = after
    .toPolygons()
    .map((ring) => {
      const svgPositions = ring.map(([x, y]) =>
        applyToPoint(circuitWorldToSvgTransform, { x, y }),
      )
      return `M ${svgPositions.map(({ x, y }) => `${x},${y}`).join(" L ")} Z`
    })
    .join(" ")
  await expect(
    `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="770" viewBox="-62 -58 124 114"><rect x="-62" y="-58" width="124" height="114" fill="#f8fafc"/><text x="0" y="-53" text-anchor="middle" font-size="2.6">Enclosed bridge preserved; separate rounded slot unchanged</text><path d="${path}" fill="#166534" fill-rule="evenodd"/></svg>`,
  ).toMatchSvgSnapshot(import.meta.path)
  for (const geometry of [
    before,
    after,
    bridgeSection,
    bridgeMaterial,
    extraRouting,
  ])
    geometry.delete()
})
