import {
  AutoroutingPipelineSolver9_PreloadedTraceGraph,
  type SimpleRouteJson,
} from "@tscircuit/capacity-autorouter"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import focused from "./focused.json"

// The published package exposes the stage through its pipeline definition,
// while the stage's parameter type is reachable through the public instance.
export type SelectedA64RepairSolver = NonNullable<
  AutoroutingPipelineSolver9_PreloadedTraceGraph["pipeline9JointDrcRepairSolver"]
>
export type A64RepairParams = SelectedA64RepairSolver["params"]
export type A64RepairCheckpoint = Omit<
  A64RepairParams,
  "connMap" | "mutatedPreloadedTraceIds"
> & { mutatedPreloadedTraceIds: string[] }

export function loadRealA64RepairCheckpoint(): A64RepairCheckpoint {
  const compressed = readFileSync(
    new URL("./real-joint-checkpoint.json.gz", import.meta.url),
  )
  return JSON.parse(
    gunzipSync(Uint8Array.from(compressed)).toString("utf8"),
  ) as A64RepairCheckpoint
}

export function getFocusedA64RepairCheckpoint(): A64RepairCheckpoint {
  const srj = structuredClone(focused.srj) as SimpleRouteJson
  return {
    srj,
    srjWithPointPairs: srj,
    originalSrj: srj,
    newConnections: srj.connections,
    newHdRoutes: [
      {
        connectionName: focused.trace.connection_name,
        rootConnectionName: focused.trace.connection_name,
        traceThickness: srj.minTraceWidth,
        viaDiameter: 0.327,
        route: focused.trace.route.flatMap((point) =>
          point.route_type === "wire"
            ? [{ x: point.x, y: point.y, z: point.layer === "top" ? 0 : 1 }]
            : [],
        ),
        vias: [{ x: 132.404, y: -85.4 }],
      },
    ],
    updatedPreloadedTraces: [],
    mutatedPreloadedTraceIds: [],
    obstacles: srj.obstacles,
    layerCount: srj.layerCount,
    defaultViaDiameter: 0.327,
    defaultViaHoleDiameter: 0.2,
    effort: 1,
    colorMap: {},
  }
}

/** Replay the actual published repair stage; no routing implementation is copied. */
export function repairSelectedA64(
  checkpoint: A64RepairCheckpoint,
): SelectedA64RepairSolver {
  const pipeline = new AutoroutingPipelineSolver9_PreloadedTraceGraph(
    structuredClone(checkpoint.originalSrj),
    { cacheProvider: null, effort: 1 },
  )
  const stage = pipeline.pipelineDef.find(
    (definition) => definition.solverName === "pipeline9JointDrcRepairSolver",
  )
  if (!stage)
    throw new Error("Selected autorouter has no joint DRC repair stage")
  const params: A64RepairParams = {
    ...structuredClone(checkpoint),
    connMap: pipeline.connMap,
    mutatedPreloadedTraceIds: new Set(checkpoint.mutatedPreloadedTraceIds),
  }
  const repair = Reflect.construct(stage.solverClass, [
    params,
  ]) as SelectedA64RepairSolver
  repair.solve()
  return repair
}
