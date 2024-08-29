import { traceProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Port } from "./Port"
import {
  IJumpAutorouter,
  autoroute,
  getObstaclesFromSoup,
  markObstaclesAsConnected,
} from "@tscircuit/infgrid-ijump-astar"
import type {
  AnySoupElement,
  PCBTrace,
  RouteHintPoint,
  SchematicTrace,
} from "@tscircuit/soup"
import type {
  Obstacle,
  SimpleRouteConnection,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import { computeObstacleBounds } from "lib/utils/autorouting/computeObstacleBounds"
import { projectPointInDirection } from "lib/utils/projectPointInDirection"
import type { TraceHint } from "./TraceHint"
import { findPossibleTraceLayerCombinations } from "lib/utils/autorouting/findPossibleTraceLayerCombinations"
import { pairs } from "lib/utils/pairs"
import { mergeRoutes } from "lib/utils/autorouting/mergeRoutes"

type PcbRouteObjective =
  | RouteHintPoint
  | { layers: string[]; x: number; y: number; via?: boolean }

const portToObjective = (port: Port): PcbRouteObjective => {
  const portPosition = port.getGlobalPcbPosition()
  return {
    ...portPosition,
    layers: port.getAvailablePcbLayers(),
  }
}

export class Trace extends PrimitiveComponent<typeof traceProps> {
  source_trace_id: string | null = null
  pcb_trace_id: string | null = null
  schematic_trace_id: string | null = null

  get config() {
    return {
      zodProps: traceProps,
    }
  }

  getTracePortPathSelectors(): string[] {
    if ("from" in this.props && "to" in this.props) {
      return [
        typeof this.props.from === "string"
          ? this.props.from
          : this.props.from.getPortSelector(),
        typeof this.props.to === "string"
          ? this.props.to
          : this.props.to.getPortSelector(),
      ]
    }
    if ("path" in this.props) {
      return this.props.path.map((p) =>
        typeof p === "string" ? p : p.getPortSelector(),
      )
    }
    return []
  }

  _findConnectedPorts():
    | { allPortsFound: true; ports: Array<{ selector: string; port: Port }> }
    | { allPortsFound: false; ports?: undefined } {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const portSelectors = this.getTracePortPathSelectors()

    const ports = portSelectors.map((selector) => ({
      selector,
      port: parent.selectOne(selector, { type: "port" }) as Port,
    }))

    for (const { selector, port } of ports) {
      if (!port) {
        const parentSelector = selector.replace(/\>.*$/, "")
        const targetComponent = parent.selectOne(parentSelector)
        if (!targetComponent) {
          this.renderError(`Could not find port for selector "${selector}"`)
        } else {
          this.renderError(
            `Could not find port for selector "${selector}"\nsearched component ${targetComponent.getString()}, which has ports:${targetComponent.children
              .filter((c) => c.componentName === "Port")
              .map((c) => `  ${c.getString()}`)
              .join("\n")}`,
          )
        }
      }
    }

    if (ports.some((p) => !p.port)) {
      return { allPortsFound: false }
    }

    return { allPortsFound: true, ports }
  }

  doInitialSourceTraceRender(): void {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) {
      this.renderError("Trace has no parent")
      return
    }

    const { allPortsFound, ports } = this._findConnectedPorts()
    if (!allPortsFound) return

    const trace = db.source_trace.insert({
      connected_source_port_ids: ports.map((p) => p.port.source_port_id!),
      connected_source_net_ids: [],
    })

    this.source_trace_id = trace.source_trace_id
  }

  doInitialPcbTraceRender(): void {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const { allPortsFound, ports } = this._findConnectedPorts()

    if (!allPortsFound) return

    const pcbElements: AnySoupElement[] = db
      .toArray()
      .filter(
        (elm) =>
          elm.type === "pcb_smtpad" ||
          elm.type === "pcb_trace" ||
          elm.type === "pcb_plated_hole" ||
          elm.type === "pcb_hole" ||
          elm.type === "source_port" ||
          elm.type === "pcb_port",
      )

    const source_trace = db.source_trace.get(this.source_trace_id!)!

    const hints = ports.flatMap(({ port }) =>
      port.matchedComponents.filter((c) => c.componentName === "TraceHint"),
    ) as TraceHint[]

    const pcbRouteHints = (this._parsedProps.pcbRouteHints ?? []).concat(
      hints.flatMap((h) => h.getPcbRouteHints()),
    )

    if (ports.length > 2) {
      this.renderError(
        `Trace has more than two ports (${ports
          .map((p) => p.port.getString())
          .join(
            ", ",
          )}), routing between more than two ports for a single trace is not implemented`,
      )
      return
    }

    if (pcbRouteHints.length === 0) {
      const { solution } = autoroute(pcbElements.concat([source_trace]))
      // TODO for some reason, the solution gets duplicated inside ijump-astar
      const inputPcbTrace = solution[0]
      const pcb_trace = db.pcb_trace.insert(inputPcbTrace as any)

      this.pcb_trace_id = pcb_trace.pcb_trace_id
      return
    }

    // When we have hints, we have to order the hints then route between each
    // terminal of the trace and the hints
    // TODO order based on proximity to ports
    const orderedRouteObjectives: PcbRouteObjective[] = [
      portToObjective(ports[0].port),
      ...pcbRouteHints,
      portToObjective(ports[1].port),
    ]

    // Hints can indicate where there should be a via, but the layer is allowed
    // to be unspecified, therefore we need to find possible layer combinations
    // to go to each hint and still route to the start and end points
    const candidateLayerCombinations = findPossibleTraceLayerCombinations(
      orderedRouteObjectives,
    )

    if (candidateLayerCombinations.length === 0) {
      this.renderError(
        `Could not find a common layer (using hints) for trace ${this.getString()}`,
      )
    }

    // Cache the PCB obstacles, they'll be needed for each segment between
    // ports/hints
    const obstacles = getObstaclesFromSoup(this.project!.db.toArray())
    markObstaclesAsConnected(
      obstacles,
      orderedRouteObjectives,
      this.source_trace_id!,
    )

    // TODO explore all candidate layer combinations if one fails
    const candidateLayerSelections = candidateLayerCombinations[0].layer_path

    /**
     * Apply the candidate layer selections to the route objectives, now we
     * have a set of points that have definite layers
     */
    const orderedRoutePoints = orderedRouteObjectives.map((t, idx) => {
      if (t.via) {
        return {
          ...t,
          via_to_layer: candidateLayerSelections[idx],
        }
      }
      return { ...t, layers: [candidateLayerSelections[idx]] }
    })

    const routes: PCBTrace["route"][] = []
    for (const [a, b] of pairs(orderedRoutePoints)) {
      const BOUNDS_MARGIN = 2 //mm
      const ijump = new IJumpAutorouter({
        input: {
          obstacles,
          connections: [
            {
              name: this.source_trace_id!,
              pointsToConnect: [a, b],
            },
          ],
          layerCount: 1,
          bounds: {
            minX: Math.min(a.x, b.x) - BOUNDS_MARGIN,
            maxX: Math.max(a.x, b.x) + BOUNDS_MARGIN,
            minY: Math.min(a.y, b.y) - BOUNDS_MARGIN,
            maxY: Math.max(a.y, b.y) + BOUNDS_MARGIN,
          },
        },
      })
      const traces = ijump.solveAndMapToTraces()
      if (traces.length === 0) {
        this.renderError(
          `Could not find a route between ${a.x}, ${a.y} and ${b.x}, ${b.y}`,
        )
        return
      }
      // TODO ijump returns multiple traces for some reason
      const [trace] = traces as PCBTrace[]
      routes.push(trace.route)
    }

    const pcb_trace = db.pcb_trace.insert({
      route: mergeRoutes(routes),
      source_trace_id: this.source_trace_id!,
    })
    this.pcb_trace_id = pcb_trace.pcb_trace_id
  }

  doInitialSchematicTraceRender(): void {
    const { db } = this.project!
    const { _parsedProps: props, parent } = this

    if (!parent) throw new Error("Trace has no parent")

    const { allPortsFound, ports } = this._findConnectedPorts()

    if (!allPortsFound) return

    const obstacles: Obstacle[] = []
    const connection: SimpleRouteConnection = {
      name: this.source_trace_id!,
      pointsToConnect: [],
    }

    for (const elm of db.toArray()) {
      if (elm.type === "schematic_component") {
        obstacles.push({
          type: "rect",
          center: elm.center,
          width: elm.size.width,
          height: elm.size.height,
          connectedTo: [],
        })
      }
    }

    for (const { port } of ports) {
      connection.pointsToConnect.push(
        projectPointInDirection(
          port.getGlobalSchematicPosition(),
          port.facingDirection!,
          0.1501,
        ),
      )
    }

    const bounds = computeObstacleBounds(obstacles)

    const simpleRouteJsonInput: SimpleRouteJson = {
      obstacles,
      connections: [connection],
      bounds,
      layerCount: 1,
    }

    const autorouter = new IJumpAutorouter({
      input: simpleRouteJsonInput,
    })
    const results = autorouter.solve()

    if (results.length === 0) return

    const [result] = results

    if (!result.solved) return

    const { route } = result

    const edges: SchematicTrace["edges"] = []

    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i]
      const to = route[i + 1]

      edges.push({
        from,
        to,
        // TODO to_schematic_port_id and from_schematic_port_id
      })
    }

    const trace = db.schematic_trace.insert({
      source_trace_id: this.source_trace_id!,

      edges,
    })

    this.schematic_trace_id = trace.schematic_trace_id
  }
}
