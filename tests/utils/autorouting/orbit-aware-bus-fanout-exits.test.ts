import { expect, test } from "bun:test"
import { getOctilinearOrbitFanoutTail } from "lib/utils/autorouting/get-octilinear-orbit-fanout-tail"

test("builds, validates, and snapshots octilinear orbit fanout exits", () => {
  const scenarios = [-135, -45, 0, 15, 30, 45, 60, 75, 90].map(
    (angleDegrees, scenarioIndex) => {
      const angleRadians = (angleDegrees * Math.PI) / 180
      const sourceComponentCenter = { x: 0, y: 0 }
      const targetComponentCenter = {
        x: Math.cos(angleRadians) * 3.2,
        y: Math.sin(angleRadians) * 3.2,
      }
      const exitPoint = {
        route_type: "wire" as const,
        x: angleDegrees <= 45 ? 1 : 0,
        y: angleDegrees <= 45 ? 0 : 1,
        width: 0.1,
        layer: "top",
      }
      const tail = getOctilinearOrbitFanoutTail({
        exitPoint,
        sourceComponentCenter,
        targetComponentCenter,
        outwardDistance: 0.8,
      })
      const route = [exitPoint, ...tail]
      for (let routeIndex = 1; routeIndex < route.length; routeIndex++) {
        const previousPoint = route[routeIndex - 1]!
        const point = route[routeIndex]!
        const deltaX = Math.abs(point.x - previousPoint.x)
        const deltaY = Math.abs(point.y - previousPoint.y)
        expect(
          deltaX <= 1e-6 || deltaY <= 1e-6 || Math.abs(deltaX - deltaY) <= 1e-6,
        ).toBe(true)
      }
      const panelX = 18 + (scenarioIndex % 5) * 215
      const panelY = 28 + Math.floor(scenarioIndex / 5) * 265
      const toSvgPoint = (point: { x: number; y: number }) =>
        `${panelX + 92 + point.x * 32},${panelY + 112 - point.y * 32}`
      return `<g>
  <rect x="${panelX}" y="${panelY}" width="196" height="238" rx="8" fill="#0b1018" stroke="#334155"/>
  <text x="${panelX + 12}" y="${panelY + 24}" fill="#e2e8f0" font-family="monospace" font-size="14">orbit ${angleDegrees}°</text>
  <line x1="${toSvgPoint(sourceComponentCenter).split(",")[0]}" y1="${toSvgPoint(sourceComponentCenter).split(",")[1]}" x2="${toSvgPoint(targetComponentCenter).split(",")[0]}" y2="${toSvgPoint(targetComponentCenter).split(",")[1]}" stroke="#475569" stroke-dasharray="4 4"/>
  <rect x="${panelX + 60}" y="${panelY + 80}" width="64" height="64" rx="5" fill="#111827" stroke="#f59e0b" stroke-width="2"/>
  <polyline points="${route.map(toSvgPoint).join(" ")}" fill="none" stroke="#22d3ee" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${toSvgPoint(targetComponentCenter).split(",")[0]}" cy="${toSvgPoint(targetComponentCenter).split(",")[1]}" r="5" fill="#fb7185"/>
</g>`
    },
  )

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1110" height="560" viewBox="0 0 1110 560">
  <rect width="900" height="560" fill="#05070a"/>
  <text x="18" y="20" fill="#fff" font-family="monospace" font-size="16">Orbit-aware octilinear bus fanout exits</text>
  ${scenarios.join("\n  ")}
</svg>`
  expect(svg).toMatchSvgSnapshot(import.meta.path)

  const exitPoint = {
    route_type: "wire" as const,
    x: 1,
    y: 0,
    width: 0.1,
    layer: "top",
  }
  expect(
    getOctilinearOrbitFanoutTail({
      exitPoint,
      sourceComponentCenter: { x: 0, y: 0 },
      targetComponentCenter: { x: 10, y: 0.01 },
      outwardDistance: 0.8,
    }),
  ).toEqual([{ ...exitPoint, x: 1.8 }])
  expect(() =>
    getOctilinearOrbitFanoutTail({
      exitPoint: { ...exitPoint, width: Number.NaN },
      sourceComponentCenter: { x: 0, y: 0 },
      targetComponentCenter: { x: 1, y: 1 },
      outwardDistance: 0.8,
    }),
  ).toThrow("finite")
})
