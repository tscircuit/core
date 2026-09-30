import { expect, test } from "bun:test"
import { createWideTraceObstacle } from "tests/fixtures/wide-trace-obstacle"

test("visualize copper omitted by existing trace obstacles", async () => {
  const { trace, obstacles } = createWideTraceObstacle()
  const start = trace.route[0]
  const end = trace.route[1]
  if (start.route_type !== "wire" || end.route_type !== "wire") {
    throw new Error("Expected a single wire segment")
  }
  // PCB world coordinates are millimeters, +X right and +Y up.
  // Each SVG viewport maps those points to pixels, flipping Y for the screen.
  const geometry = (scale: number, originX: number, originY: number) => `
    <line x1="${originX + start.x * scale}" y1="${originY - start.y * scale}"
      x2="${originX + end.x * scale}" y2="${originY - end.y * scale}"
      stroke="#e5a34b" stroke-width="${start.width * scale}" stroke-linecap="round"/>
    ${obstacles
      .map(
        (obstacle) => `<rect
      x="${originX + (obstacle.center.x - obstacle.width / 2) * scale}"
      y="${originY - (obstacle.center.y + obstacle.height / 2) * scale}"
      width="${obstacle.width * scale}" height="${obstacle.height * scale}"
      fill="#167d9a"/>`,
      )
      .join("")}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560" viewBox="0 0 1000 560">
    <defs><clipPath id="zoom"><rect x="50" y="300" width="400" height="190" rx="8"/></clipPath></defs>
    <rect width="1000" height="560" fill="#f8fafc"/>
    <g font-family="Arial, sans-serif" fill="#172b40">
      <text x="40" y="46" font-size="25" font-weight="bold">Existing copper is wider than its routing obstacle</text>
      <text x="40" y="77" font-size="16">One top-layer trace · 10 mm centerline · ${start.width} mm copper width · no clearance added</text>
      <rect x="40" y="101" width="18" height="14" fill="#e5a34b"/>
      <text x="68" y="114" font-size="15">Actual copper (round end caps)</text>
      <rect x="360" y="101" width="18" height="14" fill="#167d9a"/>
      <text x="388" y="114" font-size="15">Obstacle returned by core</text>
      ${geometry(80, 100, 185)}
      <text x="100" y="236" font-size="16">Returned obstacle: ${obstacles[0].width} × ${obstacles[0].height} mm</text>
      <text x="530" y="236" font-size="16">Copper bounds: 10.5 × 0.5 mm</text>
      <text x="50" y="284" font-size="18" font-weight="bold">Left endpoint · enlarged 5×</text>
      <rect x="50" y="300" width="400" height="190" rx="8" fill="#edf1f5"/>
      <g clip-path="url(#zoom)">${geometry(400, 180, 395)}</g>
      <line x1="180" y1="310" x2="180" y2="480" stroke="#172b40" stroke-dasharray="4 4"/>
      <text x="65" y="516" font-size="14">Dashed line: centerline endpoint (x = 0 mm)</text>
      <text x="500" y="331" font-size="19" font-weight="bold">What the snapshot exposes</text>
      <text x="500" y="370" font-size="16">1. Copper above and below the blue strip is omitted.</text>
      <text x="500" y="405" font-size="16">2. The round end cap extends beyond the obstacle.</text>
      <text x="500" y="455" font-size="16">Orange-only regions contain copper, but this</text>
      <text x="500" y="479" font-size="16">conversion does not mark them as occupied.</text>
    </g>
  </svg>`
  await expect(svg.replace(/ +\n/g, "\n")).toMatchSvgSnapshot(
    import.meta.path,
    undefined,
    {
      diffThresholdPercent: 0,
    },
  )
})
