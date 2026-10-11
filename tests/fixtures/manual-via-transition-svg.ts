import type { RootCircuit } from "lib"

const escapeText = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")

/**
 * Annotated X/layer cutaway of emitted Circuit JSON: board-world X in mm,
 * +X right; copper layers top to bottom downward on the page. All fixture
 * points have Y=0. Layer spacing is schematic, not physical dielectric depth.
 */
export function renderManualViaTransitionSvg(
  circuit: RootCircuit,
  api: string,
) {
  const traces = circuit.db.pcb_trace.list()
  const vias = circuit.db.pcb_via.list()
  const errors = circuit.db.pcb_trace_error.list()
  const rejected =
    errors.some((error) => /via.*does not reach.*top/i.test(error.message)) &&
    traces.length === 0 &&
    vias.length === 0
  const status = rejected ? "PASS" : "FAIL"
  const color = rejected ? "#47dcad" : "#ff7575"
  const layers = ["top", "inner1", "inner2", "bottom"]
  const x = (boardX: number) => 550 + boardX * 85
  const y = (layer: string) => 250 + layers.indexOf(layer) * 90
  const copper = traces
    .flatMap((trace) =>
      trace.route.slice(1).map((point, index) => {
        const previous = trace.route[index]!
        if (point.route_type !== "wire" && point.route_type !== "via") return ""
        if (previous.route_type !== "wire" && previous.route_type !== "via")
          return ""
        const layer =
          previous.route_type === "wire" ? previous.layer : previous.to_layer
        if (point.route_type === "wire" && point.layer !== layer) return ""
        return `<line x1="${x(previous.x)}" y1="${y(layer)}" x2="${x(point.x)}" y2="${y(layer)}" stroke="#f5bb5b" stroke-width="7" stroke-linecap="round"/>`
      }),
    )
    .join("")
  const barrels = vias
    .map((via, index) => {
      const occupiedY = via.layers.map(y)
      const minY = Math.min(...occupiedY)
      const maxY = Math.max(...occupiedY)
      return `<rect x="${x(via.x) - 9}" y="${minY - 7}" width="18" height="${maxY - minY + 14}" rx="5" fill="#f5bb5b"/>
      <text x="${x(via.x)}" y="${maxY + 32}" text-anchor="middle" font-size="16" fill="#f5bb5b">Via ${index + 1}: ${escapeText(via.layers.join(", "))}</text>`
    })
    .join("")
  const firstVia = vias[0]
  const gap =
    firstVia && !firstVia.layers.includes("top")
      ? `<line x1="${x(firstVia.x)}" y1="${y("top") + 14}" x2="${x(firstVia.x)}" y2="${Math.min(...firstVia.layers.map(y)) - 18}" stroke="#ff7575" stroke-width="3" stroke-dasharray="6 5"/>
    <circle cx="${x(firstVia.x)}" cy="${y("top")}" r="13" fill="none" stroke="#ff7575" stroke-width="3"/>
    <text x="${x(firstVia.x) - 22}" y="${y("inner1")}" text-anchor="end" fill="#ff7575" font-size="19">No barrel contact on top</text>`
      : ""
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="760" viewBox="0 0 1100 760">
    <rect width="1100" height="760" fill="#101a29"/>
    <g font-family="Arial, sans-serif" fill="#e4edf7">
      <text x="550" y="42" text-anchor="middle" font-size="27" font-weight="bold">Top wire enters a bottom → inner2 manual via</text>
      <text x="550" y="74" text-anchor="middle" font-size="18">Four layers · blind/buried enabled · ${escapeText(api)} · Circuit JSON cutaway</text>
      <rect x="55" y="98" width="990" height="82" rx="12" fill="${color}" fill-opacity="0.12"/>
      <text x="550" y="132" text-anchor="middle" font-size="27" font-weight="bold" fill="${color}">Assertion ${status}: ${rejected ? "invalid transition rejected" : "missing diagnosis; disconnected copper accepted"}</text>
      <text x="550" y="160" text-anchor="middle" font-size="17">Expected: reject this deliberately malformed path before copper is emitted</text>
      ${layers.map((layer) => `<text x="62" y="${y(layer) + 6}" font-size="21">${layer}</text><line x1="160" x2="1020" y1="${y(layer)}" y2="${y(layer)}" stroke="#425367" stroke-width="2" stroke-dasharray="5 5"/>`).join("")}
      ${copper}${barrels}${gap}
      ${rejected ? `<text x="590" y="365" text-anchor="middle" font-size="29" fill="${color}">No invalid copper emitted</text><text x="590" y="397" text-anchor="middle" font-size="19">The bad input remains invalid; it was not repaired or rerouted</text>` : ""}
      <rect x="55" y="594" width="990" height="118" rx="12" fill="#1d2b3e"/>
      <text x="78" y="623" font-size="20">Observed: pcb_trace=${traces.length}, pcb_via=${vias.length}, pcb_trace_error=${errors.length}</text>
      <text x="78" y="654" font-size="17">${rejected ? "Diagnosis: " + escapeText(errors[0]!.message.replace(/ for .*/, "")) : "errors: [] · Incoming top wire stops above the first emitted barrel"}</text>
      <text x="78" y="685" font-size="16">X positions and barrel occupancy from actual output; layer spacing is schematic</text>
      <text x="550" y="740" text-anchor="middle" font-size="15" fill="#9dafc4">Amber = emitted copper · dashed lines = copper layer planes · red = physical gap</text>
    </g>
  </svg>`.replaceAll(/[ \t]+\n/g, "\n")
}
