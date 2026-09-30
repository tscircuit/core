import { BaseSolver } from "@tscircuit/solver-utils"
import {
  matchComponentDogboneViaSites,
  type PreparedBus,
  type DogboneViaSiteGeometryRules,
} from "@tscircuit/fanout-solver"
import type { PcbPort, SourceTrace } from "circuit-json"
import type { GraphicsObject } from "graphics-debug"
import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"
import { getViaBoardLayers } from "../getViaSpanLayers"

/** Serializable board-world points in mm: +X right, +Y up, +Z above,
 * right-handed. Pad placement/rotation/reflection has already been applied. */
export interface DogboneFanoutSolverInput {
  input: SimpleRouteJson
  sources: { port: PcbPort; sourceTraceId: SourceTrace["source_trace_id"] }[]
  fanoutRoutingLayers?: PcbPort["layers"]
  traceWidth: number
  clearance: number
  viaDiameter: number
  holeDiameter: number
  viaClearance: number
  boardEdgeClearance: number
  holeClearance: number
}

export interface DogboneFanoutTrace extends SimplifiedPcbTrace {
  source_trace_id: SourceTrace["source_trace_id"]
}

/** Local dogbone assignment, replayable without a Circuit or component tree.
 * Each step advances one component assignment or one validated escape trace. */
export class DogboneFanoutSolver extends BaseSolver {
  phase: "preparing" | "assigning_sites" | "creating_traces" | "complete" =
    "preparing"
  private sites = new Map<number, { x: number; y: number }>()
  private traces: DogboneFanoutTrace[] = []
  private steps: Generator<void>

  constructor(public readonly params: DogboneFanoutSolverInput) {
    super()
    this.MAX_ITERATIONS = params.sources.length * 2 + 10
    this.steps = this.solveSteps()
  }

  getConstructorParams(): [DogboneFanoutSolverInput] {
    return [this.params]
  }

  _step() {
    try {
      if (this.steps.next().done) {
        this.phase = "complete"
        this.progress = 1
        this.solved = true
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
      this.failed = true
    }
  }

  getOutput(): DogboneFanoutTrace[] {
    if (!this.solved)
      throw new Error(this.error ?? "Dogbone fanout is not solved")
    return this.traces
  }

  visualize(): GraphicsObject {
    return {
      rects: this.params.input.obstacles.map((pad) => ({
        center: pad.center,
        width: pad.width,
        height: pad.height,
        fill: "rgba(200,40,40,0.3)",
        label: pad.obstacleId,
      })),
      circles: [...this.sites.values()].map((center) => ({
        center,
        radius: this.params.viaDiameter / 2,
        fill: "orange",
      })),
      lines: [...this.sites].map(([index, via]) => ({
        points: [this.params.sources[index]!.port, via],
        strokeColor: "orange",
        strokeWidth: this.params.traceWidth,
      })),
    }
  }

  private *solveSteps(): Generator<void> {
    const {
      input,
      sources,
      fanoutRoutingLayers,
      traceWidth,
      clearance,
      viaDiameter,
      holeDiameter,
      viaClearance,
      boardEdgeClearance,
      holeClearance,
    } = this.params
    const layers = getViaBoardLayers(input.layerCount)
    const allowedLayers = fanoutRoutingLayers ?? layers
    if (allowedLayers.some((layer) => !layers.includes(layer)))
      throw new Error("Dogbone fanout targets an unavailable board layer")
    const buses: PreparedBus[] = []
    const targets = sources.map(({ port, sourceTraceId }, connectionIndex) => {
      const sourceObstacle = input.obstacles.find(
        (obstacle) =>
          obstacle.componentId === port.pcb_component_id &&
          Math.hypot(obstacle.center.x - port.x, obstacle.center.y - port.y) <
            1e-6,
      )
      if (!sourceObstacle)
        throw new Error(
          "Dogbone fanout requires a component pad at each source port",
        )
      if (port.layers.length !== 1 || !layers.includes(port.layers[0]!)) {
        throw new Error("Dogbone fanout requires a single-layer SMT source pad")
      }
      const sourceLayer = port.layers[0]!
      const targetLayer = allowedLayers.find((layer) => layer !== sourceLayer)
      if (!targetLayer)
        throw new Error(
          "Dogbone fanout requires a legal layer distinct from the source pad",
        )
      let bus = buses.find(
        (bus) => bus.componentId === sourceObstacle.componentId,
      )
      if (!bus) {
        const pads = input.obstacles.filter(
          (obstacle) => obstacle.componentId === sourceObstacle.componentId,
        )
        const xs = [
          ...new Set(pads.map((pad) => Math.round(pad.center.x * 1e6) / 1e6)),
        ].sort((a, b) => a - b)
        const ys = [
          ...new Set(pads.map((pad) => Math.round(pad.center.y * 1e6) / 1e6)),
        ].sort((a, b) => a - b)
        if (xs.length < 2 || ys.length < 2)
          throw new Error("Dogbone fanout requires a two-dimensional pad grid")
        const pitch = (coordinates: number[]) =>
          Math.min(...coordinates.slice(1).map((v, i) => v - coordinates[i]!))
        bus = {
          busId: sourceObstacle.componentId!,
          componentId: sourceObstacle.componentId!,
          componentObstacles: pads,
          connections: [],
          direction: "down",
          termination: { type: "boundary" },
          componentBounds: {
            minX: xs[0]!,
            maxX: xs.at(-1)!,
            minY: ys[0]!,
            maxY: ys.at(-1)!,
          },
          sharedBoundary: input.bounds,
          xCoordinates: xs,
          yCoordinates: ys,
          pitchX: pitch(xs),
          pitchY: pitch(ys),
        }
        buses.push(bus)
      }
      const sourcePoint = {
        x: port.x,
        y: port.y,
        layer: sourceLayer,
        pcb_port_id: port.pcb_port_id,
      }
      bus.connections.push({
        connectionIndex,
        connection: { name: port.pcb_port_id, pointsToConnect: [sourcePoint] },
        sourcePoint,
        sourcePointIndex: 0,
        sourceLayer,
        sourceObstacle,
        targetPoint: sourcePoint,
      })
      return { sourceTraceId, port, sourceLayer, targetLayer }
    })
    const sites = this.sites
    const blockingSegments: NonNullable<
      DogboneViaSiteGeometryRules["blockingSegments"]
    >[number][] = []
    const blockingVias: NonNullable<
      DogboneViaSiteGeometryRules["blockingVias"]
    >[number][] = []
    for (const bus of buses) {
      this.phase = "assigning_sites"
      yield
      const assignment = matchComponentDogboneViaSites([bus], {
        traceWidth,
        clearance: Math.max(clearance, viaClearance),
        viaDiameter,
        viaHoleDiameter: holeDiameter,
        holeToHoleClearance: holeClearance,
        additionalObstacles: input.obstacles,
        blockingSegments,
        blockingVias,
      })
      if (!assignment || assignment.size !== bus.connections.length)
        throw new Error(
          "No complete local dogbone assignment within clearance/search limits",
        )
      for (const connection of bus.connections) {
        const connectionIndex = connection.connectionIndex
        const via = assignment.get(connectionIndex)!
        sites.set(connectionIndex, via)
        blockingSegments.push({
          connectionIndex,
          segment: {
            start: connection.sourcePoint,
            end: via,
            width: traceWidth,
            layer: connection.sourceLayer,
          },
        })
        blockingVias.push({
          connectionIndex,
          center: via,
          diameter: viaDiameter,
          spanLayers: layers,
        })
      }
    }
    this.phase = "creating_traces"
    for (const [
      index,
      { sourceTraceId, port, sourceLayer, targetLayer },
    ] of targets.entries()) {
      const via = sites.get(index)!
      const dx = Math.abs(via.x - port.x),
        dy = Math.abs(via.y - port.y)
      if (dx > 1e-6 && dy > 1e-6 && Math.abs(dx - dy) > 1e-6)
        throw new Error(
          "Dogbone fanout requires straight or 45-degree local escapes",
        )
      const margin = viaDiameter / 2 + boardEdgeClearance
      if (
        via.x < input.bounds.minX + margin ||
        via.x > input.bounds.maxX - margin ||
        via.y < input.bounds.minY + margin ||
        via.y > input.bounds.maxY - margin
      )
        throw new Error("Dogbone via violates board-edge clearance")
      this.traces.push({
        type: "pcb_trace",
        pcb_trace_id: `dogbone_${port.pcb_port_id}`,
        source_trace_id: sourceTraceId,
        connectsTo: [port.pcb_port_id],
        route: [
          {
            route_type: "wire",
            x: port.x,
            y: port.y,
            layer: sourceLayer,
            width: traceWidth,
          },
          { route_type: "wire", ...via, layer: sourceLayer, width: traceWidth },
          {
            route_type: "via",
            ...via,
            from_layer: sourceLayer,
            to_layer: targetLayer,
            via_diameter: viaDiameter,
            via_hole_diameter: holeDiameter,
            layers,
          },
          { route_type: "wire", ...via, layer: targetLayer, width: traceWidth },
          { route_type: "wire", ...via, layer: targetLayer, width: traceWidth },
        ],
      })
      this.progress = (index + 1) / targets.length
      yield
    }
  }
}
