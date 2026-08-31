import { expect, test } from "bun:test"
import type { CanonicalBusFanoutDirection } from "@tscircuit/props"
import { getOrbitAwareBusFanoutDirections } from "lib/utils/autorouting/get-orbit-aware-bus-fanout-directions"

const baseDirections = {
  BYTE0: "rightside_top",
  CONTROL: "rightside_center",
  BYTE1: "rightside_bottom",
} as const

const expectedDirectionsByAngle = {
  0: ["rightside_top", "rightside_center", "rightside_bottom"],
  90: ["topside_left", "topside_center", "topside_right"],
  180: ["leftside_bottom", "leftside_center", "leftside_top"],
  270: ["bottomside_right", "bottomside_center", "bottomside_left"],
} as const

const getExitPoint = (
  direction: CanonicalBusFanoutDirection,
): { x: number; y: number } => {
  const points: Partial<
    Record<CanonicalBusFanoutDirection, { x: number; y: number }>
  > = {
    rightside_top: { x: 1, y: 0.6 },
    rightside_center: { x: 1, y: 0 },
    rightside_bottom: { x: 1, y: -0.6 },
    topside_left: { x: -0.6, y: 1 },
    topside_center: { x: 0, y: 1 },
    topside_right: { x: 0.6, y: 1 },
    leftside_bottom: { x: -1, y: -0.6 },
    leftside_center: { x: -1, y: 0 },
    leftside_top: { x: -1, y: 0.6 },
    bottomside_right: { x: 0.6, y: -1 },
    bottomside_center: { x: 0, y: -1 },
    bottomside_left: { x: -0.6, y: -1 },
  }
  const point = points[direction]
  if (!point) throw new Error(`Missing SVG point for ${direction}`)
  return point
}

test("rotates, validates, and snapshots bus exits around the orbit", () => {
  for (const [angleText, expectedDirections] of Object.entries(
    expectedDirectionsByAngle,
  )) {
    const angleRadians = (Number(angleText) * Math.PI) / 180
    const directions = getOrbitAwareBusFanoutDirections({
      baseDirections,
      sourceComponentCenter: { x: 0, y: 0 },
      targetComponentCenter: {
        x: Math.cos(angleRadians) * 10,
        y: Math.sin(angleRadians) * 10,
      },
    })
    expect([directions.BYTE0, directions.CONTROL, directions.BYTE1]).toEqual([
      ...expectedDirections,
    ])
  }
  const panels = Object.keys(expectedDirectionsByAngle).map(
    (angleText, panelIndex) => {
      const angleDegrees = Number(angleText)
      const angleRadians = (angleDegrees * Math.PI) / 180
      const target = {
        x: Math.cos(angleRadians) * 3.1,
        y: Math.sin(angleRadians) * 3.1,
      }
      const directions = getOrbitAwareBusFanoutDirections({
        baseDirections,
        sourceComponentCenter: { x: 0, y: 0 },
        targetComponentCenter: target,
      })
      const panelX = 18 + panelIndex * 215
      const panelY = 34
      const toSvgPoint = (point: { x: number; y: number }) => ({
        x: panelX + 98 + point.x * 28,
        y: panelY + 118 - point.y * 28,
      })
      const sourceSvg = toSvgPoint({ x: 0, y: 0 })
      const targetSvg = toSvgPoint(target)
      const exits = Object.entries(directions).map(
        ([busId, direction], busIndex) => {
          const exit = getExitPoint(direction as CanonicalBusFanoutDirection)
          const exitSvg = toSvgPoint(exit)
          return `<path data-bus-id="${busId}" d="M ${sourceSvg.x} ${sourceSvg.y} L ${exitSvg.x} ${exitSvg.y}" fill="none" stroke="${["#22d3ee", "#f59e0b", "#a78bfa"][busIndex]}" stroke-width="5" stroke-linecap="round"/>`
        },
      )
      return `<g>
  <rect x="${panelX}" y="${panelY}" width="196" height="238" rx="8" fill="#0b1018" stroke="#334155"/>
  <text x="${panelX + 12}" y="${panelY + 24}" fill="#e2e8f0" font-family="monospace" font-size="14">orbit ${angleDegrees}°</text>
  <line x1="${sourceSvg.x}" y1="${sourceSvg.y}" x2="${targetSvg.x}" y2="${targetSvg.y}" stroke="#64748b" stroke-dasharray="4 4"/>
  <rect x="${sourceSvg.x - 28}" y="${sourceSvg.y - 28}" width="56" height="56" rx="5" fill="#111827" stroke="#f8fafc" stroke-width="2"/>
  ${exits.join("\n  ")}
  <circle cx="${targetSvg.x}" cy="${targetSvg.y}" r="5" fill="#fb7185"/>
</g>`
    },
  )
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300" viewBox="0 0 900 300">
  <rect width="900" height="300" fill="#05070a"/>
  <text x="18" y="22" fill="#fff" font-family="monospace" font-size="16">Bus fanout edges follow the orbit quadrant</text>
  ${panels.join("\n  ")}
</svg>`
  expect(svg).toMatchSvgSnapshot(import.meta.path)

  expect(() =>
    getOrbitAwareBusFanoutDirections({
      baseDirections: { A: "rightside_top", B: "topside_center" },
      sourceComponentCenter: { x: 0, y: 0 },
      targetComponentCenter: { x: 1, y: 0 },
    }),
  ).toThrow("same physical edge")
  expect(() =>
    getOrbitAwareBusFanoutDirections({
      baseDirections: { A: "center_right" },
      sourceComponentCenter: { x: 0, y: 0 },
      targetComponentCenter: { x: 1, y: 0 },
    }),
  ).toThrow("requires canonical directions")
})
