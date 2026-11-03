import { simplifyCopperRoute } from "./simplify-copper-route"
import {
  PortfolioSingleIntraNodeSolver,
  type SimpleRouteJson,
  type SimplifiedPcbTraces,
  type Obstacle,
} from "@tscircuit/capacity-autorouter"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

type PhysicalSolver = ReturnType<
  PortfolioSingleIntraNodeSolver["generateSolver"]
>
type ObstacleRoute = PhysicalSolver["solvedRoutes"][number]
type SingleSolver = NonNullable<PhysicalSolver["activeSubSolver"]>

/** Use capacity-autorouter's geometric search with fixed copper preloaded. */
export class GridRoutingSolver {
  solved = false
  failed = false
  error?: string
  private solver: PhysicalSolver
  private input: SimpleRouteJson
  private layers: string[]
  private configuredSearches = new WeakSet<SingleSolver>()
  private ownObstacleChecks: {
    obstacle: Obstacle
    transform: ReturnType<typeof compose>
  }[]

  constructor(input: SimpleRouteJson) {
    this.input = input
    this.layers = [
      "top",
      ...Array.from(
        { length: input.layerCount - 2 },
        (_, index) => `inner${index + 1}`,
      ),
      "bottom",
    ]
    const connection = input.connections[0]!
    this.ownObstacleChecks = input.obstacles
      .filter((obstacle) => obstacle.connectedTo.includes(connection.name))
      .map((obstacle) => ({
        obstacle,
        transform: compose(
          rotateDEG(-(obstacle.ccwRotationDegrees ?? 0)),
          translate(-obstacle.center.x, -obstacle.center.y),
        ),
      }))
    const bounds = input.bounds
    const portfolio = new PortfolioSingleIntraNodeSolver({
      nodeWithPortPoints: {
        capacityMeshNodeId: "physical_board_region",
        center: {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2,
        },
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
        availableZ: this.layers.map((_, index) => index),
        portPoints: connection.pointsToConnect.map((point) => ({
          x: point.x,
          y: point.y,
          z: this.layers.indexOf(point.layer ?? point.layers?.[0] ?? ""),
          connectionName: connection.name,
          rootConnectionName: connection.name,
          pcb_port_id: point.pcb_port_id,
        })),
      },
      layerCount: input.layerCount,
      traceWidth: connection.nominalTraceWidth ?? input.minTraceWidth,
      viaDiameter: input.minViaPadDiameter ?? 0.4,
      obstacleMargin: Math.max(
        0,
        (input.defaultObstacleMargin ?? 0.15) -
          (connection.nominalTraceWidth ?? input.minTraceWidth) / 2 +
          0.01,
      ),
    })
    const endpoints = connection.pointsToConnect
    const distance =
      endpoints.length === 2
        ? Math.hypot(
            endpoints[0]!.x - endpoints[1]!.x,
            endpoints[0]!.y - endpoints[1]!.y,
          )
        : 0
    this.solver = portfolio.generateSolver({
      CELL_SIZE_FACTOR: distance > 20 ? 2 : 0.5,
      VIA_PENALTY_FACTOR_2: 0.1,
      MISALIGNED_DIST_PENALTY_FACTOR: 0,
      ALLOW_DIAGONAL: true,
    })
    this.solver.MAX_ITERATIONS = 5_000_000
    if ("cacheProvider" in this.solver) this.solver.cacheProvider = null
    this.solver.solvedRoutes = input.obstacles.flatMap(
      (obstacle, index): ObstacleRoute[] => {
        if (
          obstacle.isCopperPour ||
          obstacle.connectedTo.includes(connection.name)
        )
          return []
        const transform = compose(
          translate(obstacle.center.x, obstacle.center.y),
          rotateDEG(obstacle.ccwRotationDegrees ?? 0),
        )
        const rows = Math.max(1, Math.ceil(obstacle.height / 0.1))
        return obstacle.layers.flatMap((layer) => {
          const z = this.layers.indexOf(layer)
          if (z < 0) return []
          return Array.from({ length: rows + 1 }, (_, row) => {
            const y = -obstacle.height / 2 + (obstacle.height * row) / rows
            const first = applyToPoint(transform, { x: -obstacle.width / 2, y })
            const last = applyToPoint(transform, { x: obstacle.width / 2, y })
            return {
              connectionName: `fixed_copper_${index}_${z}_${row}`,
              traceThickness: input.minTraceWidth,
              viaDiameter: input.minViaPadDiameter ?? 0.4,
              route: [
                { ...first, z },
                { ...last, z },
              ],
              vias: [],
            }
          })
        })
      },
    )
  }

  step() {
    if (this.solver.activeSubSolver) {
      const search = this.solver.activeSubSolver
      search.MAX_ITERATIONS = 5_000_000
      if (!this.configuredSearches.has(search)) {
        this.configuredSearches.add(search)
        const original = search.isNodeTooCloseToObstacle.bind(search)
        search.isNodeTooCloseToObstacle = (
          ...parameters: Parameters<SingleSolver["isNodeTooCloseToObstacle"]>
        ) => {
          const [node, , isVia] = parameters
          if (isVia) {
            for (const { obstacle, transform } of this.ownObstacleChecks) {
              const local = applyToPoint(transform, node)
              const distance = Math.hypot(
                Math.max(Math.abs(local.x) - obstacle.width / 2, 0),
                Math.max(Math.abs(local.y) - obstacle.height / 2, 0),
              )
              if (
                obstacle.circuitJsonMetadata?.pcb_smtpad_id &&
                distance < (this.input.minViaHoleDiameter ?? 0.2) / 2 + 0.05
              )
                return true
              if (
                obstacle.shape === "circle" &&
                obstacle.layers.length === this.input.layerCount
              ) {
                const separation = Math.hypot(local.x, local.y)
                if (separation > 0.00001 && separation < 0.45) return true
              }
            }
          }
          return original(...parameters)
        }
      }
    }
    this.solver.step()
    // Fixed obstacle envelopes are input geometry, not connections to repair.
    this.solved = this.solver.solvedRoutes.some(
      (trace) => trace.connectionName === this.input.connections[0]!.name,
    )
    this.failed = this.solver.failed
    this.error = this.solver.error ?? undefined
  }

  getCurrentPhase() {
    return "capacity_autorouter_geometric_search"
  }

  getOutputSimplifiedPcbTraces(): SimplifiedPcbTraces {
    return this.solver.solvedRoutes
      .filter(
        (trace) => trace.connectionName === this.input.connections[0]!.name,
      )
      .map((trace, index) => {
        const route: SimplifiedPcbTraces[number]["route"] = []
        for (
          let pointIndex = 0;
          pointIndex < trace.route.length;
          pointIndex++
        ) {
          const point = trace.route[pointIndex]!
          const previous = trace.route[pointIndex - 1]
          if (previous && previous.z !== point.z) {
            if (
              Math.hypot(previous.x - point.x, previous.y - point.y) > 0.000001
            )
              throw new Error(
                "Geometric route changes layers without a coincident via",
              )
            route.push({
              route_type: "via",
              x: point.x,
              y: point.y,
              from_layer: this.layers[previous.z]!,
              to_layer: this.layers[point.z]!,
              layers: this.layers,
              via_diameter: trace.viaDiameter,
              via_hole_diameter: this.input.minViaHoleDiameter ?? 0.2,
            })
          }
          route.push({
            route_type: "wire",
            x: point.x,
            y: point.y,
            layer: this.layers[point.z]!,
            width: point.traceThickness ?? trace.traceThickness,
          })
        }
        return {
          type: "pcb_trace",
          pcb_trace_id: `${trace.connectionName}_grid_${index}`,
          connection_name: this.input.connections[0]!.name,
          route: simplifyCopperRoute(route),
        }
      })
  }
}
