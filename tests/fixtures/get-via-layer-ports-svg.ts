import type { AnyCircuitElement } from "circuit-json"

/**
 * Section of the via fixture at board-world y = 0. Input points and diameters
 * are in mm, +X is right, +Z is above the board (right-handed XYZ).
 * SVG X scales world X; SVG Y descends through layers with exaggerated spacing.
 */
export function getViaLayerPortsSvg(circuitJson: AnyCircuitElement[]): string {
  const board = circuitJson.find((element) => element.type === "pcb_board")!
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const ports = circuitJson.filter((element) => element.type === "pcb_port")
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const errors = circuitJson.filter(
    (element) => element.type === "source_trace_not_connected_error",
  )
  const layers = [
    "top",
    ...Array.from({ length: board.num_layers - 2 }, (_, i) => `inner${i + 1}`),
    "bottom",
  ]
  const x = (mm: number) => 450 + mm * 90
  const y = (layer: string) => 130 + layers.indexOf(layer) * 55
  const inner2Ports = vias.map((via) =>
    ports.find(
      (port) =>
        via.pcb_port_ids?.includes(port.pcb_port_id) &&
        port.layers.includes("inner2"),
    ),
  )
  const connected =
    errors.length === 0 &&
    inner2Ports.length === 2 &&
    traces.some(
      ({ route }) =>
        route.length >= 2 &&
        route.every(
          (point) => point.route_type === "wire" && point.layer === "inner2",
        ) &&
        inner2Ports.every(
          (port) =>
            port &&
            [route[0], route.at(-1)!].some(
              (point) =>
                point.route_type === "wire" &&
                point.x === port.x &&
                point.y === port.y,
            ),
        ),
    )
  const accent = connected ? "#008965" : "#d94242"
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="400" viewBox="0 0 900 400">
<rect width="900" height="400" fill="#fff"/>
<g font-family="Arial, sans-serif" fill="#1d1d1f">
<text x="450" y="26" text-anchor="middle" font-size="12" fill="#86868b">tscircuit/core · React circuits → PCB geometry</text>
<text x="450" y="57" text-anchor="middle" font-size="25" font-weight="600">Through-hole vias · inner2</text>
<text x="450" y="84" text-anchor="middle" font-size="14" fill="${accent}">${connected ? "PASS · Copper connected" : "FAIL · Inner2 disconnected"}</text>`,
  ]
  for (const layer of layers) {
    svg.push(`<line x1="180" y1="${y(layer)}" x2="720" y2="${y(layer)}" stroke="#e5e5ea" stroke-width="2"/>
<text x="150" y="${y(layer) + 5}" text-anchor="end" font-size="14" fill="#86868b">${layer}</text>`)
  }
  for (const via of vias) {
    const top = Math.min(...via.layers.map(y))
    const bottom = Math.max(...via.layers.map(y))
    svg.push(`<rect x="${x(via.x) - via.outer_diameter * 45}" y="${top - 8}" width="${via.outer_diameter * 90}" height="${bottom - top + 16}" rx="4" fill="#e6bf77"/>
<rect x="${x(via.x) - via.hole_diameter * 45}" y="${top - 9}" width="${via.hole_diameter * 90}" height="${bottom - top + 18}" fill="#fff"/>`)
  }
  for (const trace of traces) {
    for (let i = 1; i < trace.route.length; i++) {
      const a = trace.route[i - 1]
      const b = trace.route[i]
      if (
        a.route_type !== "wire" ||
        b.route_type !== "wire" ||
        a.layer !== b.layer ||
        a.y !== 0 ||
        b.y !== 0 ||
        a.x === b.x
      )
        continue
      svg.push(
        `<line x1="${x(a.x)}" y1="${y(a.layer)}" x2="${x(b.x)}" y2="${y(b.layer)}" stroke="#008965" stroke-width="${b.width * 90}" stroke-linecap="round"/>`,
      )
    }
  }
  for (const via of vias) {
    for (const layer of via.layers) {
      const port = ports.find(
        (port) =>
          via.pcb_port_ids?.includes(port.pcb_port_id) &&
          port.layers.includes(layer),
      )
      svg.push(
        port
          ? `<circle cx="${x(port.x)}" cy="${y(layer)}" r="7" fill="#008965" stroke="#fff" stroke-width="2"/>`
          : `<circle cx="${x(via.x)}" cy="${y(layer)}" r="8" fill="#fff" stroke="#d94242" stroke-width="1.5"/>
<path d="M ${x(via.x) - 3} ${y(layer) - 3} l 6 6 m 0 -6 l -6 6" stroke="#d94242" stroke-width="1.5" stroke-linecap="round"/>`,
      )
    }
  }
  svg.push(`<text x="450" y="350" text-anchor="middle" font-size="14" fill="#86868b">${ports.length} ports · ${traces.length} trace${traces.length === 1 ? "" : "s"} · ${errors.length} missing-port errors</text>
<text x="450" y="382" text-anchor="middle" font-size="11" fill="#a1a1a6">Circuit JSON · y = 0 section · layer spacing exaggerated</text>
</g></svg>`)
  return svg.join("\n")
}
