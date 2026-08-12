import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver7_MultiGraph } from "@tscircuit/capacity-autorouter"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"

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

test.failing(
  "parent-route simplification should not crash on fallback transition geometry",
  () => {
    const solver = new TraceSimplificationSolver({
      hdRoutes: [
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
      ],
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

    // The full pipeline already completed via removal before reaching this
    // state, so begin at its next phase to keep the Core regression under the
    // repository's 30-second CI limit.
    solver.currentPhase = "crossing_via_reduction"

    expect(() => solver.solve()).not.toThrow()
    expect(solver.failed).toBeFalse()
  },
)
