import { GridRoutingSolver } from "./grid-routing"
import { anchorCopperToPorts } from "./port-anchored-routing"
import { findCopperConflicts } from "./routing-clearance"
import { EventEmitter } from "eventemitter3"
import {
  AutoroutingPipelineSolver9_PreloadedTraceGraph,
  AutoroutingPipelineSolver3_HgPortPointPathing,
  type SimpleRouteJson,
  type SimplifiedPcbTraces,
  type Obstacle,
} from "@tscircuit/capacity-autorouter"
import {
  SavedAutorouter,
  parseSavedCopperRecord,
  type SavedCopper,
} from "./saved-autorouter"

import groundDropJson from "../routing/ground-drops"
import supplyDropJson from "../routing/supply-drops"
import fixedCopperJson from "../routing/copper-results"
import { fanoutTracePath } from "@tscircuit/props"

const fixedNativePaths = [...groundDropJson, ...supplyDropJson].map((path) =>
  fanoutTracePath.parse(path),
)
const fixedCopperSnapshot = parseSavedCopperRecord(fixedCopperJson)

type RoutingEvents = {
  complete: [{ traces: SimplifiedPcbTraces }]
  error: [{ error: Error }]
  invalid_candidate: [
    { input: SimpleRouteJson; traces: SimplifiedPcbTraces; findings: string[] },
  ]
  prepared: [{ input: SimpleRouteJson }]
}

export class LocalAutorouter extends EventEmitter<RoutingEvents> {
  solver:
    | AutoroutingPipelineSolver9_PreloadedTraceGraph
    | AutoroutingPipelineSolver3_HgPortPointPathing
    | GridRoutingSolver
  input: SimpleRouteJson
  private routingInput: SimpleRouteJson
  private retried = false
  private escaped = false
  private expanded = false
  private allObstacles: Obstacle[]
  private escapeTraces: SimplifiedPcbTraces = []
  private stopped = false
  private timer?: ReturnType<typeof setTimeout>
  private attemptStartedAt = Date.now()
  private lastPhase = ""

  constructor(input: SimpleRouteJson) {
    super()
    this.input = input
    const points = input.connections.flatMap(
      (connection) => connection.pointsToConnect,
    )
    if (points.length === 0) throw new Error("Routing phase has no endpoints")
    const padding = 2
    const bounds = {
      minX: Math.max(
        input.bounds.minX,
        Math.min(...points.map((point) => point.x)) - padding,
      ),
      maxX: Math.min(
        input.bounds.maxX,
        Math.max(...points.map((point) => point.x)) + padding,
      ),
      minY: Math.max(
        input.bounds.minY,
        Math.min(...points.map((point) => point.y)) - padding,
      ),
      maxY: Math.min(
        input.bounds.maxY,
        Math.max(...points.map((point) => point.y)) + padding,
      ),
    }
    const nativeTraces: SimplifiedPcbTraces = fixedNativePaths.map(
      (path, index) => ({
        type: "pcb_trace",
        pcb_trace_id: `fixed_native_${index}`,
        connection_name: `fixed_native_${index}`,
        route: path.route,
      }),
    )
    const cachedTraces: SimplifiedPcbTraces = Object.entries(
      fixedCopperSnapshot,
    ).flatMap(([name, saved]) =>
      saved.traces.map((trace) => ({
        ...trace,
        connection_name: `fixed_cache_${name}`,
        connectsTo: [],
      })),
    )
    const fixedTraceObstacles = createFixedTraceObstacles({
      ...input,
      traces: [...(input.traces ?? []), ...nativeTraces, ...cachedTraces],
    })
    const connectedCopper = (input.traces ?? []).filter(
      (trace) => trace.connection_name === input.connections[0]!.name,
    )
    const owners = new Set([
      ...input.connections.flatMap((connection) => [
        connection.name,
        ...connection.pointsToConnect.flatMap((point) => [
          point.pcb_port_id ?? "",
          point.pointId ?? "",
        ]),
      ]),
      ...connectedCopper.flatMap((trace) => trace.connectsTo ?? []),
    ])
    this.allObstacles = deduplicateObstacles([
      ...input.obstacles,
      ...fixedTraceObstacles,
    ]).map((obstacle) => {
      const own = obstacle.connectedTo.some((identity) => owners.has(identity))
      const identity =
        obstacle.connectedTo.find((identity) =>
          identity.startsWith("connectivity_net"),
        ) ?? obstacle.connectedTo[0]
      const { offBoardConnectsTo, ...physicalObstacle } = obstacle
      return {
        ...physicalObstacle,
        connectedTo: own
          ? [input.connections[0]!.name]
          : identity
            ? [identity]
            : [],
      }
    })
    const obstacles = this.allObstacles.filter(
      (obstacle) =>
        obstacle.center.x + obstacle.width / 2 >= bounds.minX &&
        obstacle.center.x - obstacle.width / 2 <= bounds.maxX &&
        obstacle.center.y + obstacle.height / 2 >= bounds.minY &&
        obstacle.center.y - obstacle.height / 2 <= bounds.maxY,
    )
    console.log(
      `Routing local region ${JSON.stringify(bounds)} with ${obstacles.length} obstacles`,
    )
    this.routingInput = {
      ...input,
      bounds,
      obstacles,
      traces: [],
      allowBlindAndBuriedVias: false,
      allowViaInPad: false,
      defaultObstacleMargin: 0.15,
      allowJumpers: false,
    }
    const reserved = reserveDensePinEscapes(this.routingInput, connectedCopper)
    this.routingInput = reserved.routingInput
    this.escapeTraces = reserved.escapeTraces
    for (const point of this.routingInput.connections[0]!.pointsToConnect) {
      const portId = point.pcb_port_id ?? point.pointId
      const connected = connectedCopper.filter(
        (trace) => portId && trace.connectsTo?.includes(portId),
      )
      const vias = connected.flatMap((trace) =>
        trace.route.filter((routePoint) => routePoint.route_type === "via"),
      )
      const closest = vias.sort(
        (first, second) =>
          Math.hypot(first.x - point.x, first.y - point.y) -
          Math.hypot(second.x - point.x, second.y - point.y),
      )[0]
      if (!closest || Math.hypot(closest.x - point.x, closest.y - point.y) > 3)
        continue
      this.escapeTraces.push(...connected)
      point.x = closest.x
      point.y = closest.y
      point.layer = "top"
      console.log(
        "Reusing physically connected branch via",
        portId,
        point.x,
        point.y,
      )
    }
    const escapedPoints = this.routingInput.connections[0]!.pointsToConnect
    const throughViaEndpoints = escapedPoints.every((point) =>
      this.routingInput.obstacles.some(
        (obstacle) =>
          obstacle.shape === "circle" &&
          obstacle.layers.length === input.layerCount &&
          obstacle.connectedTo.includes(input.connections[0]!.name) &&
          Math.hypot(obstacle.center.x - point.x, obstacle.center.y - point.y) <
            0.00001,
      ),
    )
    if (
      escapedPoints.length === 2 &&
      throughViaEndpoints &&
      Math.hypot(
        escapedPoints[0]!.x - escapedPoints[1]!.x,
        escapedPoints[0]!.y - escapedPoints[1]!.y,
      ) > 20
    ) {
      for (const point of escapedPoints) point.layer = "inner2"
      console.log("Routing between existing through vias on inner2")
    }
    const terminals = input.connections[0]!.pointsToConnect
    this.solver =
      terminals.length === 2 &&
      (connectedCopper.length > 0 ||
        Math.hypot(
          terminals[0]!.x - terminals[1]!.x,
          terminals[0]!.y - terminals[1]!.y,
        ) > 8)
        ? new GridRoutingSolver(this.routingInput)
        : new AutoroutingPipelineSolver9_PreloadedTraceGraph(this.routingInput)
  }

  start() {
    this.stopped = false
    this.emit("prepared", { input: this.routingInput })
    const advance = () => {
      if (this.stopped) return
      try {
        const deadline = Date.now() + 30
        while (
          !this.solver.solved &&
          !this.solver.failed &&
          Date.now() < deadline
        )
          this.solver.step()
        if (this.solver.getCurrentPhase() !== this.lastPhase) {
          this.lastPhase = this.solver.getCurrentPhase()
          console.log("Routing stage", this.lastPhase)
        }
        if (
          !this.solver.solved &&
          Date.now() - this.attemptStartedAt > 120000
        ) {
          this.solver.failed = true
          this.solver.error = "Local routing attempt exceeded 120 seconds"
        }
        if (this.solver.solved) {
          const traces = [
            ...this.escapeTraces,
            ...this.solver.getOutputSimplifiedPcbTraces(),
          ]
          const findings = findCopperConflicts({
            input: this.routingInput,
            traces,
          })
          try {
            this.getOwnedOutputTraces()
          } catch (error) {
            findings.push(
              error instanceof Error ? error.message : String(error),
            )
          }
          if (findings.length) {
            console.log("Rejecting solved copper", findings.slice(0, 5))
            this.emit("invalid_candidate", {
              input: this.routingInput,
              traces,
              findings,
            })
            this.solver.solved = false
            this.solver.failed = true
            this.solver.error = "Solved copper violates physical clearance"
          }
        }
        if (this.solver.failed) {
          console.log("Routing search failed:", this.solver.error)
          if (!this.escaped) {
            this.escaped = true
            const escapedInput = createEscapedInput(this.routingInput)
            this.escapeTraces.push(...escapedInput.escapeTraces)
            this.routingInput = escapedInput.routingInput
            console.log(
              "Retrying with autorouter-generated terminal escapes",
              this.escapeTraces.length,
            )
            this.solver = new AutoroutingPipelineSolver9_PreloadedTraceGraph(
              this.routingInput,
            )
            this.attemptStartedAt = Date.now()
            this.timer = setTimeout(advance, 0)
          } else if (!this.expanded) {
            this.expanded = true
            const obstacles = new Map<string, Obstacle>()
            for (const obstacle of [
              ...this.allObstacles,
              ...this.routingInput.obstacles,
            ]) {
              const identity = JSON.stringify([
                obstacle.center,
                obstacle.width,
                obstacle.height,
                obstacle.layers,
                obstacle.connectedTo,
              ])
              obstacles.set(identity, obstacle)
            }
            this.routingInput = {
              ...this.routingInput,
              bounds: this.input.bounds,
              obstacles: [...obstacles.values()],
            }
            console.log(
              "Retrying connection with the full board routing region",
            )
            this.solver = new GridRoutingSolver(this.routingInput)
            this.attemptStartedAt = Date.now()
            this.timer = setTimeout(advance, 0)
          } else if (!this.retried) {
            this.retried = true
            console.log(
              "Retrying local connection with autorouter pipeline 3:",
              this.solver.error,
            )
            this.solver = new AutoroutingPipelineSolver3_HgPortPointPathing(
              this.routingInput,
            )
            this.attemptStartedAt = Date.now()
            this.timer = setTimeout(advance, 0)
          } else
            this.emit("error", {
              error: new Error(this.solver.error ?? "Autorouting failed"),
            })
        } else if (this.solver.solved) {
          this.emit("complete", { traces: this.getOwnedOutputTraces() })
        } else this.timer = setTimeout(advance, 0)
      } catch (error) {
        this.emit("error", {
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }
    this.timer = setTimeout(advance, 0)
  }

  stop() {
    this.stopped = true
    if (this.timer !== undefined) clearTimeout(this.timer)
  }

  private getOwnedOutputTraces(): SimplifiedPcbTraces {
    return anchorCopperToPorts({
      input: this.input,
      traces: [
        ...this.escapeTraces,
        ...this.solver.getOutputSimplifiedPcbTraces(),
      ],
    })
  }

  getOutputSimpleRouteJson(): SimpleRouteJson {
    return {
      ...this.input,
      traces: [...(this.input.traces ?? []), ...this.getOwnedOutputTraces()],
    }
  }
}

export async function createLocalAutorouter(
  input: SimpleRouteJson,
  saved?: SavedCopper,
) {
  if (saved) return new SavedAutorouter(input, saved)
  if (input.connections[0]!.pointsToConnect.length > 2)
    return new BranchAutorouter(input)
  return new LocalAutorouter(input)
}

/** Submit a physical minimum-spanning tree as individually checked branches. */
export class BranchAutorouter extends EventEmitter<RoutingEvents> {
  private input: SimpleRouteJson
  private traces: SimplifiedPcbTraces = []
  private currentRouter?: LocalAutorouter
  private stopped = false

  constructor(input: SimpleRouteJson) {
    super()
    this.input = input
  }

  start() {
    const connection = this.input.connections[0]!
    const connected = [connection.pointsToConnect[0]!]
    const remaining = connection.pointsToConnect.slice(1)
    const routeNext = () => {
      if (this.stopped) return
      if (!remaining.length) {
        try {
          this.traces = anchorCopperToPorts({
            input: this.input,
            traces: this.traces,
          })
          this.emit("complete", { traces: this.traces })
        } catch (error) {
          this.emit("error", {
            error: error instanceof Error ? error : new Error(String(error)),
          })
        }
        return
      }
      let shortest = Infinity
      let source = connected[0]!
      let targetIndex = 0
      for (const candidate of connected) {
        for (let index = 0; index < remaining.length; index++) {
          const target = remaining[index]!
          const distance = Math.hypot(
            candidate.x - target.x,
            candidate.y - target.y,
          )
          if (distance < shortest) {
            shortest = distance
            source = candidate
            targetIndex = index
          }
        }
      }
      const target = remaining[targetIndex]!
      console.log(
        "Routing checked branch",
        connected.length,
        "of",
        connection.pointsToConnect.length - 1,
      )
      const router = new LocalAutorouter({
        ...this.input,
        connections: [{ ...connection, pointsToConnect: [source, target] }],
        traces: [...(this.input.traces ?? []), ...this.traces],
      })
      this.currentRouter = router
      router.on("invalid_candidate", (candidate) =>
        this.emit("invalid_candidate", candidate),
      )
      router.on("prepared", (prepared) => this.emit("prepared", prepared))
      router.on("error", (error) => this.emit("error", error))
      router.on("complete", (result) => {
        this.traces.push(
          ...result.traces.map((trace, index) => ({
            ...trace,
            pcb_trace_id: `${connection.name}_branch_${connected.length}_${index}`,
          })),
        )
        connected.push(target)
        remaining.splice(targetIndex, 1)
        setTimeout(routeNext, 0)
      })
      router.start()
    }
    setTimeout(routeNext, 0)
  }

  stop() {
    this.stopped = true
    this.currentRouter?.stop()
  }

  getOutputSimpleRouteJson(): SimpleRouteJson {
    return {
      ...this.input,
      traces: [...(this.input.traces ?? []), ...this.traces],
    }
  }
}

/** Repeated port-to-port paths share copper; reserve each physical shape once. */
function deduplicateObstacles(obstacles: Obstacle[]): Obstacle[] {
  const unique = new Map<string, Obstacle>()
  for (const obstacle of obstacles) {
    const identity = JSON.stringify([
      obstacle.type,
      obstacle.shape,
      obstacle.center,
      obstacle.width,
      obstacle.height,
      obstacle.layers,
      obstacle.ccwRotationDegrees,
      obstacle.isCopperPour,
    ])
    const previous = unique.get(identity)
    if (previous)
      previous.connectedTo = [
        ...new Set([...previous.connectedTo, ...obstacle.connectedTo]),
      ]
    else
      unique.set(identity, {
        ...obstacle,
        connectedTo: [...obstacle.connectedTo],
      })
  }
  return [...unique.values()]
}

/** Reserve completed copper, including through-hole lands on every layer. */
export function createFixedTraceObstacles(input: SimpleRouteJson): Obstacle[] {
  const allLayers = [
    "top",
    ...Array.from(
      { length: input.layerCount - 2 },
      (_, index) => `inner${index + 1}`,
    ),
    "bottom",
  ]
  const obstacles: Obstacle[] = []
  for (const trace of input.traces ?? []) {
    const connectedTo = [
      trace.connection_name ?? trace.pcb_trace_id,
      ...(trace.connectsTo ?? []),
    ]
    for (let index = 0; index < trace.route.length; index++) {
      const point = trace.route[index]!
      if (point.route_type === "via") {
        const diameter = point.via_diameter ?? input.minViaPadDiameter ?? 0.6
        obstacles.push({
          type: "rect",
          shape: "circle",
          center: { x: point.x, y: point.y },
          width: diameter,
          height: diameter,
          layers: allLayers,
          connectedTo,
        })
        continue
      }
      if (point.route_type !== "wire") continue
      const next = trace.route[index + 1]
      if (!next || next.route_type !== "wire" || next.layer !== point.layer)
        continue
      const dx = next.x - point.x
      const dy = next.y - point.y
      const length = Math.hypot(dx, dy)
      const count =
        Math.abs(dx) < 0.000001 || Math.abs(dy) < 0.000001
          ? 1
          : Math.max(1, Math.ceil(length / 0.2))
      const width = Math.max(point.width, next.width)
      for (let step = 0; step < count; step++) {
        const fraction = (step + 0.5) / count
        const diagonal = Math.abs(dx) > 0.000001 && Math.abs(dy) > 0.000001
        obstacles.push({
          type: "rect",
          center: { x: point.x + dx * fraction, y: point.y + dy * fraction },
          width: diagonal
            ? length / count + width
            : Math.abs(dx) / count + width,
          height: diagonal ? width : Math.abs(dy) / count + width,
          ccwRotationDegrees: diagonal
            ? (Math.atan2(dy, dx) * 180) / Math.PI
            : undefined,
          layers: [point.layer],
          connectedTo,
        })
      }
    }
  }
  return deduplicateObstacles(obstacles)
}

function createEscapedInput(input: SimpleRouteJson): {
  routingInput: SimpleRouteJson
  escapeTraces: SimplifiedPcbTraces
} {
  const routingInput = structuredClone(input)
  const escapeTraces: SimplifiedPcbTraces = []
  const allLayers = [
    "top",
    ...Array.from(
      { length: input.layerCount - 2 },
      (_, index) => `inner${index + 1}`,
    ),
    "bottom",
  ]
  for (const sourceLayer of ["bottom", "top"]) {
    const targetLayer = sourceLayer === "bottom" ? "top" : "bottom"
    const connection = input.connections[0]!
    const sourcePoints = connection.pointsToConnect.filter(
      (point) => point.layer === sourceLayer,
    )
    if (!sourcePoints.length) continue
    const probe = new AutoroutingPipelineSolver9_PreloadedTraceGraph({
      ...routingInput,
      connections: [{ ...connection, pointsToConnect: sourcePoints }],
      obstacles: [
        ...routingInput.obstacles.filter((obstacle) => !obstacle.isCopperPour),
        {
          type: "rect",
          layers: [targetLayer],
          isCopperPour: true,
          center: {
            x: (input.bounds.minX + input.bounds.maxX) / 2,
            y: (input.bounds.minY + input.bounds.maxY) / 2,
          },
          width: input.bounds.maxX - input.bounds.minX,
          height: input.bounds.maxY - input.bounds.minY,
          connectedTo: [connection.name],
        },
      ],
    })
    let steps = 0
    while (
      !probe.escapeViaLocationSolver?.solved &&
      !probe.failed &&
      steps++ < 100000
    )
      probe.step()
    const escapeSolver = probe.escapeViaLocationSolver
    if (!escapeSolver?.solved) continue
    const diameter = escapeSolver.viaDiameter
    for (const escape of escapeSolver.createdEscapeVias) {
      const point = sourcePoints[escape.sourcePointIndex]
      if (!point) continue
      const pointId = point.pcb_port_id ?? point.pointId ?? ""
      const replacement = routingInput.connections[0]!.pointsToConnect.find(
        (candidate) => (candidate.pcb_port_id ?? candidate.pointId) === pointId,
      )
      if (!replacement) continue
      replacement.x = escape.x
      replacement.y = escape.y
      replacement.layer = targetLayer
      escapeTraces.push({
        type: "pcb_trace",
        pcb_trace_id: `${connection.name}_escape_${escapeTraces.length}`,
        connection_name: connection.name,
        connectsTo: [pointId],
        route: [
          {
            route_type: "wire",
            x: point.x,
            y: point.y,
            layer: sourceLayer,
            width: input.nominalTraceWidth ?? input.minTraceWidth,
          },
          {
            route_type: "wire",
            x: escape.x,
            y: escape.y,
            layer: sourceLayer,
            width: input.nominalTraceWidth ?? input.minTraceWidth,
          },
          {
            route_type: "via",
            x: escape.x,
            y: escape.y,
            from_layer: sourceLayer,
            to_layer: targetLayer,
            via_diameter: diameter,
            via_hole_diameter: input.minViaHoleDiameter ?? 0.2,
          },
          {
            route_type: "wire",
            x: escape.x,
            y: escape.y,
            layer: targetLayer,
            width: input.nominalTraceWidth ?? input.minTraceWidth,
          },
        ],
      })
      routingInput.obstacles.push({
        type: "rect",
        shape: "circle",
        center: { x: escape.x, y: escape.y },
        width: diameter,
        height: diameter,
        layers: allLayers,
        connectedTo: [connection.name, pointId],
      })
    }
  }
  return { routingInput, escapeTraces }
}

type ReservedEscape = {
  name: string
  pad: { x: number; y: number }
  exit: { x: number; y: number }
}

const reservedEscapes: ReservedEscape[] = [
  {
    name: "usb_current_limit",
    pad: { x: 13.35001, y: -29 },
    exit: { x: 14.35001, y: -29 },
  },
  {
    name: "usb_limit_resistor",
    pad: { x: 5.825, y: -25 },
    exit: { x: 5.225, y: -25 },
  },
  {
    name: "usb_switch_input",
    pad: { x: 10.64999, y: -29.94996 },
    exit: { x: 9.94999, y: -29.94996 },
  },
  {
    name: "dac_flying_positive",
    pad: { x: 2.870962, y: 8.275078 },
    exit: { x: 3.9, y: 8.275078 },
  },
  {
    name: "dac_flying_negative",
    pad: { x: 2.870962, y: 6.975106 },
    exit: { x: 3.9, y: 6.975106 },
  },
  {
    name: "usb_vbus_sense",
    pad: { x: 20.1998853, y: -26.7500366 },
    exit: { x: 20.439299400327965, y: -27.407821434550137 },
  },
  {
    name: "mcu_usb_enable",
    pad: { x: -8.750046, y: 28.4249527 },
    exit: { x: -9.689738620785908, y: 28.766972843325668 },
  },
  {
    name: "mcu_usb_fault",
    pad: { x: -8.750046, y: 29.6949527 },
    exit: { x: -9.750046, y: 29.6949527 },
  },
  {
    name: "boost_enable",
    pad: { x: 11.2500142, y: -18.000127 },
    exit: { x: 11.8500142, y: -18.000127 },
  },
  {
    name: "usb_enable_pull_down",
    pad: { x: 9.825, y: -11 },
    exit: { x: 9.225, y: -11 },
  },
  {
    name: "usb_load_switch_enable",
    pad: { x: 10.64999, y: -28.05004 },
    exit: { x: 11.34999, y: -28.05004 },
  },
  {
    name: "mcu_i2c_data",
    pad: { x: -8.750046, y: 24.6149527 },
    exit: { x: -9.750046, y: 24.6149527 },
  },
  {
    name: "usb_i2c_data",
    pad: { x: 19.2499507, y: -26.1998726 },
    exit: { x: 17.70446937793749, y: -25.785762127835966 },
  },
  {
    name: "usb_i2c_clock",
    pad: { x: 19.2499507, y: -25.8001274 },
    exit: { x: 18.5499507, y: -24.587691834701786 },
  },
  {
    name: "usb_interrupt",
    pad: { x: 19.4000393, y: -26.7500366 },
    exit: { x: 19.192984063917983, y: -27.522777261031255 },
  },
  {
    name: "usb_attachment",
    pad: { x: 19.4000393, y: -25.2499634 },
    exit: { x: 19.192984063917983, y: -24.477222738968745 },
  },
  {
    name: "uart_receive",
    pad: { x: -8.750046, y: 30.9649527 },
    exit: { x: -9.715971826289067, y: 31.22377174510252 },
  },
  {
    name: "display_reset",
    pad: { x: 8.750046, y: 24.6149527 },
    exit: { x: 9.800046, y: 24.6149527 },
  },
  {
    name: "host_cc2",
    pad: { x: 20.7500493, y: -26.1998726 },
    exit: { x: 20.0500493, y: -26.1998726 },
  },
  {
    name: "dac_left",
    pad: { x: 2.870962, y: 5.67488 },
    exit: { x: 3.9, y: 5.67488 },
  },
  {
    name: "dac_right",
    pad: { x: 2.870962, y: 5.024894 },
    exit: { x: 3.9, y: 5.024894 },
  },
  {
    name: "dac_negative_supply",
    pad: { x: 2.870962, y: 6.324866 },
    exit: { x: 3.9, y: 6.324866 },
  },
  {
    name: "amplifier_enable",
    pad: { x: 16.250573, y: 9.499997 },
    exit: { x: 16.250573, y: 10.15 },
  },
  {
    name: "battery_temperature",
    pad: { x: -13.500003, y: -20.249811 },
    exit: { x: -12.55, y: -20.249811 },
  },
  {
    name: "charger_input_limit",
    pad: { x: -16.499997, y: -20.249811 },
    exit: { x: -17.5, y: -20.249811 },
  },
  {
    name: "charger_input_status",
    pad: { x: -15.250063, y: -22.499997 },
    exit: { x: -15.250063, y: -23.15 },
  },
  {
    name: "charger_timer",
    pad: { x: -15.250063, y: -19.500003 },
    exit: { x: -15.5, y: -18.55 },
  },
  {
    name: "charger_current",
    pad: { x: -14.250065, y: -19.500003 },
    exit: { x: -14.25, y: -18.85 },
  },
]

/** Reserve dense-pin escape space before wide power tracks are routed. */
function reserveDensePinEscapes(
  input: SimpleRouteJson,
  connectedCopper: SimplifiedPcbTraces = [],
): { routingInput: SimpleRouteJson; escapeTraces: SimplifiedPcbTraces } {
  const routingInput = structuredClone(input)
  const connection = routingInput.connections[0]!
  const allLayers = [
    "top",
    ...Array.from(
      { length: input.layerCount - 2 },
      (_, index) => `inner${index + 1}`,
    ),
    "bottom",
  ]
  const escapeTraces: SimplifiedPcbTraces = []
  for (const escape of reservedEscapes) {
    const pad = connection.pointsToConnect.find(
      (point) =>
        Math.abs(point.x - escape.pad.x) < 0.000001 &&
        Math.abs(point.y - escape.pad.y) < 0.000001 &&
        point.layer === "bottom",
    )
    const alreadyConnected = connectedCopper.some((trace) =>
      trace.route.some(
        (point) =>
          point.route_type === "wire" &&
          point.layer === "bottom" &&
          Math.hypot(point.x - escape.pad.x, point.y - escape.pad.y) < 0.000001,
      ),
    )
    const owner =
      pad || alreadyConnected ? connection.name : `reserved_${escape.name}`
    const dx = escape.exit.x - escape.pad.x
    const dy = escape.exit.y - escape.pad.y
    const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.2))
    for (let step = 0; step < count; step++) {
      const fraction = (step + 0.5) / count
      routingInput.obstacles.push({
        type: "rect",
        center: {
          x: escape.pad.x + dx * fraction,
          y: escape.pad.y + dy * fraction,
        },
        width: Math.abs(dx) / count + 0.15,
        height: Math.abs(dy) / count + 0.15,
        layers: ["bottom"],
        connectedTo: [owner],
      })
    }
    routingInput.obstacles.push({
      type: "rect",
      shape: "circle",
      center: escape.exit,
      width: 0.4,
      height: 0.4,
      layers: allLayers,
      connectedTo: [owner],
    })
    if (!pad) continue
    const pointId = pad.pcb_port_id ?? pad.pointId ?? ""
    escapeTraces.push({
      type: "pcb_trace",
      pcb_trace_id: `${connection.name}_reserved_escape_${escape.name}`,
      connection_name: connection.name,
      connectsTo: [pointId],
      route: [
        {
          route_type: "wire",
          x: pad.x,
          y: pad.y,
          width: 0.15,
          layer: "bottom",
        },
        { route_type: "wire", ...escape.exit, width: 0.15, layer: "bottom" },
        {
          route_type: "via",
          ...escape.exit,
          from_layer: "bottom",
          to_layer: "top",
          via_diameter: 0.4,
          via_hole_diameter: 0.2,
        },
        { route_type: "wire", ...escape.exit, width: 0.15, layer: "top" },
      ],
    })
    pad.x = escape.exit.x
    pad.y = escape.exit.y
    pad.layer = "top"
  }
  return { routingInput, escapeTraces }
}
