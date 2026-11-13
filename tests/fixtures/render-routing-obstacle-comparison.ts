import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"

// Render the pads and existing copper from the captured SRJ, before routing.
export function renderRoutingObstacleComparison(
  control: SimpleRouteJson,
  withTrace: SimpleRouteJson | undefined,
  fixedTraceId: string,
) {
  const panel = (title: string, srj: SimpleRouteJson | undefined) => {
    const obstacles =
      srj?.obstacles.filter((o) => o.layers.includes("top")) ?? []
    const traces =
      srj?.traces?.filter((trace) => trace.pcb_trace_id === fixedTraceId) ?? []
    const subtitle = srj
      ? `${obstacles.length} pad obstacles, ${traces.length} fixed ${traces.length === 1 ? "trace" : "traces"}`
      : "Conversion failed before the router received input"
    const label = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="62">
      <rect width="400" height="62" fill="white"/>
      <g font-family="sans-serif" text-anchor="middle" fill="#172536">
        <text x="200" y="25" font-size="18" font-weight="bold">${title}</text>
        <text x="200" y="49" font-size="14">${subtitle}</text>
      </g>
    </svg>`
    // 31 px/mm in both panels, with PCB positive Y pointing up.
    const shapes = obstacles.map(
      ({ center, width, height, ccwRotationDegrees }) =>
        `<rect x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}"
        transform="translate(${center.x} ${center.y}) rotate(${ccwRotationDegrees ?? 0})"
        fill="#3a739d"/>`,
    )
    for (const trace of traces) {
      for (const [i, a] of trace.route.entries()) {
        const b = trace.route[i + 1]
        if (
          a.route_type === "wire" &&
          b?.route_type === "wire" &&
          a.layer === "top" &&
          b.layer === "top"
        ) {
          shapes.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
            stroke="#c55218" stroke-width="${a.width}" stroke-linecap="round"/>`)
        }
      }
    }
    const content = srj
      ? `<g transform="translate(200 110) scale(31 -31)">${shapes.join("")}</g>`
      : '<text x="200" y="116" text-anchor="middle" font-family="sans-serif" font-size="17" fill="#783610">No obstacle list emitted</text>'
    const drawing = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220">
      <rect width="400" height="220" fill="#f2f5f8"/>${content}
    </svg>`
    return stackSvgsVertically([label, drawing], {
      gap: 0,
      normalizeSize: false,
    })
  }
  const panels = stackSvgsHorizontally(
    [
      panel("R1 and R2 only", control),
      panel("Same board + fixed diagonal trace", withTrace),
    ],
    { gap: 8, normalizeSize: false },
  )
  const key = `<svg xmlns="http://www.w3.org/2000/svg" width="808" height="34">
    <rect width="808" height="34" fill="white"/>
    <g font-family="sans-serif" font-size="15" fill="#172536">
      <rect x="161" y="10" width="14" height="14" fill="#3a739d"/><text x="183" y="22">Resistor pad obstacle</text>
      <rect x="403" y="10" width="14" height="14" fill="#c55218"/><text x="425" y="22">Fixed copper in SRJ traces</text>
    </g>
  </svg>`
  return stackSvgsVertically([panels, key], { gap: 0, normalizeSize: false })
}
