import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver7_MultiGraph } from "@tscircuit/capacity-autorouter"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { AnyCircuitElement } from "circuit-json"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import "tests/fixtures/extend-expect-circuit-snapshot"

const autorouter = new TscircuitAutorouter({
  layerCount: 2,
  minTraceWidth: 0.15,
  minViaDiameter: 0.4,
  obstacles: [],
  connections: [],
  bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
})
const pipeline = (
  autorouter as unknown as {
    solver: AutoroutingPipelineSolver7_MultiGraph
  }
).solver
const traceSimplificationStep = pipeline.pipelineDef.find(
  (step) => step.solverName === "traceSimplificationSolver",
)
if (!traceSimplificationStep) {
  throw new Error("Pipeline 7 is missing its trace simplification stage")
}
const TraceSimplificationSolver = traceSimplificationStep.solverClass as new (
  input: unknown,
) => {
  currentPhase: string
  failed: boolean
  solve: () => void
}

const hdRoutes = [
  {
    connectionName: "detour",
    traceThickness: 0.15,
    viaDiameter: 0.4,
    route: [
      { x: -2, y: 4, z: 0 },
      { x: -2, y: 3, z: 0 },
      { x: -2, y: 3, z: 1 },
      { x: -2, y: -3, z: 1 },
      { x: -2, y: -3, z: 0 },
      { x: -2, y: -4, z: 0 },
    ],
    vias: [
      { x: -2, y: 3 },
      { x: -2, y: -3 },
    ],
  },
  {
    connectionName: "transition-a",
    traceThickness: 0.15,
    viaDiameter: 0.4,
    route: [
      // The full parent route emitted this layer change between two
      // different XY positions after its first simplification phase.
      { x: 1.25, y: 1.25, z: 0 },
      { x: 1, y: 1, z: 1 },
      { x: 0, y: 1, z: 1 },
      { x: 0, y: 1, z: 0 },
      { x: -3, y: 1, z: 0 },
    ],
    vias: [{ x: 0, y: 1 }],
  },
  {
    connectionName: "transition-b",
    traceThickness: 0.15,
    viaDiameter: 0.4,
    route: [
      { x: 1, y: -1, z: 1 },
      { x: 0, y: -1, z: 1 },
      { x: 0, y: -1, z: 0 },
      { x: -3, y: -1, z: 0 },
    ],
    vias: [{ x: 0, y: -1 }],
  },
]

const getReproSvg = () => {
  const toSvgX = (x: number) => 430 + x * 72
  const toSvgY = (y: number) => 315 - y * 72
  const routeSegments = hdRoutes
    .flatMap((route) =>
      route.route.slice(1).map((end, index) => {
        const start = route.route[index]
        const changesLayer = start.z !== end.z
        const isInvalidTransition =
          changesLayer && (start.x !== end.x || start.y !== end.y)
        if (changesLayer && !isInvalidTransition) return ""

        const stroke = isInvalidTransition
          ? "#f97316"
          : start.z === 0
            ? "#d32f2f"
            : "#3367a8"
        const invalidAttributes = isInvalidTransition
          ? ' stroke-dasharray="8 6"'
          : ""
        const endpointMarks = isInvalidTransition
          ? `<path d="M ${toSvgX(start.x) - 7} ${toSvgY(start.y) - 7} l 14 14 m 0 -14 l -14 14 M ${toSvgX(end.x) - 7} ${toSvgY(end.y) - 7} l 14 14 m 0 -14 l -14 14" stroke="#f97316" stroke-width="4"/>`
          : ""

        return `<line x1="${toSvgX(start.x)}" y1="${toSvgY(start.y)}" x2="${toSvgX(end.x)}" y2="${toSvgY(end.y)}" stroke="${stroke}" stroke-width="11" stroke-linecap="round"${invalidAttributes}/>${endpointMarks}`
      }),
    )
    .join("")
  const vias = hdRoutes
    .flatMap((route) => route.vias)
    .map(
      (via) =>
        `<circle cx="${toSvgX(via.x)}" cy="${toSvgY(via.y)}" r="14" fill="#ff20d6" stroke="#7e0b69" stroke-width="3"/>`,
    )
    .join("")

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
  <rect width="900" height="620" fill="#ffffff"/>
  <text x="40" y="42" font-family="sans-serif" font-size="22" font-weight="700" fill="#111827">Parent-route simplification failure</text>
  <text x="40" y="70" font-family="sans-serif" font-size="15" fill="#4b5563">The orange segment changes layers between different XY coordinates, but contains no via.</text>

  ${routeSegments}
  ${vias}

  <path d="M 690 170 C 640 185, 585 205, 530 225" fill="none" stroke="#f97316" stroke-width="3" marker-end="url(#arrow)"/>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
      <path d="M 0 0 L 9 3 L 0 6 Z" fill="#f97316"/>
    </marker>
  </defs>
  <text x="675" y="116" font-family="sans-serif" font-size="16" font-weight="700" fill="#c2410c">BUG</text>
  <text x="675" y="138" font-family="sans-serif" font-size="14" fill="#c2410c">Top → bottom diagonally</text>
  <text x="675" y="158" font-family="sans-serif" font-size="14" fill="#c2410c">No via at either endpoint</text>

  <g font-family="sans-serif" font-size="14" fill="#374151">
    <line x1="40" y1="565" x2="78" y2="565" stroke="#d32f2f" stroke-width="6" stroke-linecap="round"/>
    <text x="90" y="570">Top-layer copper</text>
    <line x1="245" y1="565" x2="283" y2="565" stroke="#3367a8" stroke-width="6" stroke-linecap="round"/>
    <text x="295" y="570">Bottom-layer copper</text>
    <circle cx="490" cy="565" r="9" fill="#ff20d6" stroke="#7e0b69" stroke-width="2"/>
    <text x="510" y="570">Real via</text>
    <line x1="630" y1="565" x2="668" y2="565" stroke="#f97316" stroke-width="6" stroke-dasharray="7 5"/>
    <text x="680" y="570">Invalid transition</text>
  </g>
</svg>`
}

const getPcbCircuitJson = (): AnyCircuitElement[] => [
  {
    type: "pcb_board",
    pcb_board_id: "pcb_board_repro",
    center: { x: -0.75, y: 0 },
    width: 8,
    height: 10,
    num_layers: 2,
  } as AnyCircuitElement,
  ...hdRoutes.map(
    (route, routeIndex) =>
      ({
        type: "pcb_trace",
        pcb_trace_id: `pcb_trace_${routeIndex}`,
        source_trace_id: `source_trace_${routeIndex}`,
        connection_name: route.connectionName,
        route: route.route.map((point) => ({
          route_type: "wire",
          x: point.x,
          y: point.y,
          width: route.traceThickness,
          layer: point.z === 0 ? "top" : "bottom",
        })),
      }) as AnyCircuitElement,
  ),
  ...hdRoutes.flatMap((route, routeIndex) =>
    route.vias.map(
      (via, viaIndex) =>
        ({
          type: "pcb_via",
          pcb_via_id: `pcb_via_${routeIndex}_${viaIndex}`,
          x: via.x,
          y: via.y,
          outer_diameter: route.viaDiameter,
          hole_diameter: 0.2,
          from_layer: "top",
          to_layer: "bottom",
          layers: ["top", "bottom"],
        }) as AnyCircuitElement,
    ),
  ),
]

test.failing(
  "parent-route simplification should not crash on fallback transition geometry",
  () => {
    const solver = new TraceSimplificationSolver({
      hdRoutes: structuredClone(hdRoutes),
      obstacles: [],
      connMap: new ConnectivityMap({
        detour_net: ["detour"],
        transition_a_net: ["transition-a"],
        transition_b_net: ["transition-b"],
      }),
      colorMap: {},
      defaultViaDiameter: 0.4,
      layerCount: 2,
      enableCrossingViaReduction: true,
    })

    expect(getReproSvg()).toMatchSvgSnapshot(import.meta.path)
    expect(getPcbCircuitJson()).toMatchPcbSnapshot(import.meta.path)

    // The full pipeline already completed via removal before reaching this
    // state, so begin at its next phase to keep the Core regression under the
    // repository's 30-second CI limit.
    solver.currentPhase = "crossing_via_reduction"

    expect(() => solver.solve()).not.toThrow()
    expect(solver.failed).toBeFalse()
  },
)
