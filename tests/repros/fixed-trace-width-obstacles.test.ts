import { expect, test } from "bun:test"
import { pcb_board, pcb_trace, type PcbTrace } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("fixed trace obstacles cover the copper width and both end caps", async () => {
  // Board-world XY in mm (+X right, +Y up), viewed from above the board.
  const wire = (x: number, y: number, width: number) => ({
    route_type: "wire" as const,
    x,
    y,
    layer: "top" as const,
    width,
  })
  const board = pcb_board.parse({
    type: "pcb_board",
    width: 10,
    height: 10,
    center: { x: 0, y: 0 },
    num_layers: 4,
  })
  const cases: {
    label: string
    route: PcbTrace["route"]
    mode?: PcbTrace["route_thickness_mode"]
    width: number
    height: number
  }[] = [
    {
      label: "Horizontal wire · 0.80 mm",
      route: [wire(-2, 0, 0.8), wire(2, 0, 0.8)],
      width: 4.8,
      height: 0.8,
    },
    {
      label: "Vertical wire · 0.60 mm",
      route: [wire(0, -2, 0.6), wire(0, 2, 0.6)],
      width: 0.6,
      height: 4.6,
    },
    {
      label: "Interpolated wire · 0.20 to 1.00 mm",
      mode: "interpolated",
      route: [wire(-2, 0, 0.2), wire(2, 0, 1)],
      width: 5,
      height: 1,
    },
    {
      label: "Through pad · 0.70 mm, top to bottom",
      route: [
        {
          route_type: "through_pad",
          start: { x: -2, y: 0 },
          end: { x: 2, y: 0 },
          width: 0.7,
          start_layer: "top",
          end_layer: "bottom",
        },
      ],
      width: 4.7,
      height: 0.7,
    },
  ]
  const panels: string[] = []
  for (const [i, sample] of cases.entries()) {
    const trace = pcb_trace.parse({
      type: "pcb_trace",
      pcb_trace_id: "fixed",
      route: sample.route,
      route_thickness_mode: sample.mode,
    })
    const obstacles = getObstaclesFromCircuitJson([board, trace])
    expect(obstacles).toHaveLength(1)
    const actual = obstacles[0]!
    expect(actual).toMatchObject({
      center: { x: 0, y: 0 },
      connectedTo: expect.arrayContaining(["fixed"]),
      layers: ["top"],
    })
    expect(actual.width).toBeCloseTo(i === 1 ? 0.1 : 4)
    expect(actual.height).toBeCloseTo(i === 1 ? 4 : 0.1)
    panels.push(`<g transform="translate(${(i % 2) * 360} ${Math.floor(i / 2) * 225})">
      <text x="180" y="25" font-size="16" font-weight="bold">${sample.label}</text>
      <g transform="translate(180 108) scale(28 -28)">
        <rect x="${actual.center.x - actual.width / 2}" y="${actual.center.y - actual.height / 2}" width="${actual.width}" height="${actual.height}" fill="#cb641d"/>
        <rect x="${-sample.width / 2}" y="${-sample.height / 2}" width="${sample.width}" height="${sample.height}" fill="none" stroke="#254766" stroke-width=".055" stroke-dasharray=".16 .11"/>
      </g>
      <text x="180" y="194" font-size="14">Emitted: ${actual.width.toFixed(2)} × ${actual.height.toFixed(2)} mm</text>
      <text x="180" y="212" font-size="13">Layers: ${actual.layers.join(", ")}</text>
    </g>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="490" viewBox="0 0 720 490">
    <rect width="720" height="490" fill="white"/><g font-family="sans-serif" text-anchor="middle" fill="#16344e">
    ${panels.join("")}<text x="360" y="473" font-size="15">Orange: emitted obstacle     ·     Dashed: required copper envelope</text></g></svg>`
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
