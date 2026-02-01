import { type SchematicNetLabel, type SchematicTrace } from "circuit-json"
import { calculateElbow } from "calculate-elbow"
import { doesLineIntersectLine, type Point } from "@tscircuit/math-utils"
import { DirectLineRouter } from "lib/utils/autorouting/DirectLineRouter"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
  Obstacle,
} from "lib/utils/autorouting/SimpleRouteJson"
import { computeObstacleBounds } from "lib/utils/autorouting/computeObstacleBounds"
import { getDominantDirection } from "lib/utils/autorouting/getDominantDirection"
import { countComplexElements } from "lib/utils/schematic/countComplexElements"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import { getStubEdges } from "lib/utils/schematic/getStubEdges"
import type { NetLabel } from "../NetLabel"
import type { Port } from "../Port"
import { createSchematicTraceCrossingSegments } from "./trace-utils/create-schematic-trace-crossing-segments"
import { createSchematicTraceJunctions } from "./trace-utils/create-schematic-trace-junctions"
import { getSchematicObstaclesForTrace } from "./trace-utils/get-obstacles-for-trace"
import { getOtherSchematicTraces } from "./trace-utils/get-other-schematic-traces"
import { pushEdgesOfSchematicTraceToPreventOverlap } from "./trace-utils/push-edges-of-schematic-trace-to-prevent-overlap"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { Trace } from "./Trace"
import { convertFacingDirectionToElbowDirection } from "lib/utils/schematic/convertFacingDirectionToElbowDirection"
import { TraceConnectionError } from "../../../errors"

export const Trace_doInitialSchematicTraceRender = (trace: Trace) => {
  if (trace.root?._featureMspSchematicTraceRouting) return
  if (trace._couldNotFindPort) return
  if (trace.root?.schematicDisabled) return
  // if (trace.getGroup()?._getSchematicLayoutMode() === "match-adapt") return
  const { db } = trace.root!
  const { _parsedProps: props, parent } = trace

  if (!parent) throw new Error("Trace has no parent")

  let allPortsFound: boolean
  let connectedPorts: Array<{ selector: string; port: Port }>

  try {
    const result = trace._findConnectedPorts()
    allPortsFound = result.allPortsFound
    connectedPorts = result.portsWithSelectors ?? []
  } catch (error) {
    if (error instanceof TraceConnectionError) {
      db.source_trace_not_connected_error.insert({
        ...error.errorData,
        error_type: "source_trace_not_connected_error",
      })
      return
    }
    throw error
  }

  const { netsWithSelectors } = trace._findConnectedNets()

  if (!allPortsFound) return

  const portIds = connectedPorts.map((p) => p.port.schematic_port_id).sort()
  const portPairKey = portIds.join(",")
  const board = trace.root?._getBoard()
  if (board?._connectedSchematicPortPairs)
    if (board._connectedSchematicPortPairs.has(portPairKey)) {
      return
    }

  const connection: SimpleRouteConnection = {
    name: trace.source_trace_id!,
    pointsToConnect: [],
  }
  const obstacles = getSchematicObstaclesForTrace(trace)

  // Get port positions for later use, filter out ports without schematic representation
  const portsWithPosition = connectedPorts
    .filter(({ port }) => port.schematic_port_id !== null)
    .map(({ port }) => ({
      port,
      position: port._getGlobalSchematicPositionAfterLayout(),
      schematic_port_id: port.schematic_port_id ?? undefined,
      facingDirection: port.facingDirection,
    }))

  const isPortAndNetConnection =
    portsWithPosition.length === 1 && netsWithSelectors.length === 1

  if (isPortAndNetConnection) {
    const net = netsWithSelectors[0].net
    const { port, position: anchorPos } = portsWithPosition[0]

    let connectedNetLabel = trace
      .getSubcircuit()
      .selectAll("netlabel")
      .find((nl: any) => {
        const conn = nl._parsedProps.connection ?? nl._parsedProps.connectsTo
        if (!conn) return false
        if (Array.isArray(conn)) {
          return conn.some((selector: string) => {
            const targetPort = trace.getSubcircuit().selectOne(selector, {
              port: true,
            }) as Port | null
            return targetPort === port
          })
        }
        const targetPort = trace.getSubcircuit().selectOne(conn, {
          port: true,
        }) as Port | null
        return targetPort === port
      }) as NetLabel | undefined | SchematicNetLabel

    if (!connectedNetLabel) {
      // Schematic Match Adapt inserts directly into the database rather than
      // creating a proper netlabel, this is hack but we should also consider
      // net labels that are just "in the database" connected to our
      // source_trace_id

      const dbNetLabel = db.schematic_net_label.getWhere({
        source_trace_id: trace.source_trace_id,
      })

      if (dbNetLabel) {
        connectedNetLabel = dbNetLabel as SchematicNetLabel
      }
    }

    if (connectedNetLabel) {
      const labelPos =
        "_getGlobalSchematicPositionBeforeLayout" in connectedNetLabel
          ? connectedNetLabel._getGlobalSchematicPositionBeforeLayout()
          : connectedNetLabel.anchor_position!
      const edges: SchematicTrace["edges"] = []
      if (anchorPos.x === labelPos.x || anchorPos.y === labelPos.y) {
        edges.push({ from: anchorPos, to: labelPos })
      } else {
        edges.push({ from: anchorPos, to: { x: labelPos.x, y: anchorPos.y } })
        edges.push({ from: { x: labelPos.x, y: anchorPos.y }, to: labelPos })
      }
      const dbTrace = db.schematic_trace.insert({
        source_trace_id: trace.source_trace_id!,
        edges,
        junctions: [],
        subcircuit_connectivity_map_key:
          trace.subcircuit_connectivity_map_key ?? undefined,
      })
      trace.schematic_trace_id = dbTrace.schematic_trace_id
      return
    }

    if (trace.props.schDisplayLabel) {
      const side =
        getEnteringEdgeFromDirection(port.facingDirection!) ?? "bottom"
      db.schematic_net_label.insert({
        text: trace.props.schDisplayLabel,
        source_net_id: net.source_net_id!,
        anchor_position: anchorPos,
        center: computeSchematicNetLabelCenter({
          anchor_position: anchorPos,
          anchor_side: side,
          text: trace.props.schDisplayLabel,
        }),
        anchor_side: side,
      })

      return
    }

    const side = getEnteringEdgeFromDirection(port.facingDirection!) ?? "bottom"
    const netLabel = db.schematic_net_label.insert({
      text: net._parsedProps.name,
      source_net_id: net.source_net_id!,
      anchor_position: anchorPos,
      center: computeSchematicNetLabelCenter({
        anchor_position: anchorPos,
        anchor_side: side,
        text: net._parsedProps.name,
      }),
      anchor_side: side,
    })

    return
  }

  if (trace.props.schDisplayLabel) {
    if (
      ("from" in trace.props && "to" in trace.props) ||
      "path" in trace.props
    ) {
      trace._doInitialSchematicTraceRenderWithDisplayLabel()
      return
    }
  }

  // Ensure there are at least two ports
  // Else return insufficient ports to draw a trace
  if (portsWithPosition.length < 2) {
    return
  }

  const attemptElbowEdges = () => {
    const elbowEdges: SchematicTrace["edges"] = []
    for (let i = 0; i < portsWithPosition.length - 1; i++) {
      const start = portsWithPosition[i]
      const end = portsWithPosition[i + 1]
      const path = calculateElbow(
        {
          x: start.position.x,
          y: start.position.y,
          facingDirection: convertFacingDirectionToElbowDirection(
            start.facingDirection,
          ),
        },
        {
          x: end.position.x,
          y: end.position.y,
          facingDirection: convertFacingDirectionToElbowDirection(
            end.facingDirection,
          ),
        },
      )
      for (let j = 0; j < path.length - 1; j++) {
        elbowEdges.push({ from: path[j], to: path[j + 1] })
      }
    }
    const doesSegmentIntersectRect = (
      edge: { from: { x: number; y: number }; to: { x: number; y: number } },
      rect: Obstacle,
    ) => {
      const halfW = rect.width / 2
      const halfH = rect.height / 2
      const left = rect.center.x - halfW
      const right = rect.center.x + halfW
      const top = rect.center.y - halfH
      const bottom = rect.center.y + halfH

      const inRect = (p: { x: number; y: number }) =>
        p.x >= left && p.x <= right && p.y >= top && p.y <= bottom

      if (inRect(edge.from) || inRect(edge.to)) return true

      const rectEdges = [
        [
          { x: left, y: top },
          { x: right, y: top },
        ],
        [
          { x: right, y: top },
          { x: right, y: bottom },
        ],
        [
          { x: right, y: bottom },
          { x: left, y: bottom },
        ],
        [
          { x: left, y: bottom },
          { x: left, y: top },
        ],
      ] as Array<[Point, Point]>
      return rectEdges.some((r) =>
        doesLineIntersectLine([edge.from, edge.to], r, { lineThickness: 0 }),
      )
    }

    for (const edge of elbowEdges) {
      for (const obstacle of obstacles) {
        if (doesSegmentIntersectRect(edge, obstacle)) {
          return null
        }
      }
    }

    return elbowEdges
  }

  let edges: SchematicTrace["edges"] | null = attemptElbowEdges()
  if (edges && edges.length === 0) {
    edges = null
  }

  // Add points for autorouter to connect
  connection.pointsToConnect = portsWithPosition.map(({ position }) => ({
    ...position,
    layer: "top",
  }))

  const bounds = computeObstacleBounds(obstacles)

  const BOUNDS_MARGIN = 2 // mm
  const simpleRouteJsonInput: SimpleRouteJson = {
    minTraceWidth: 0.1,
    obstacles,
    connections: [connection],
    bounds: {
      minX: bounds.minX - BOUNDS_MARGIN,
      maxX: bounds.maxX + BOUNDS_MARGIN,
      minY: bounds.minY - BOUNDS_MARGIN,
      maxY: bounds.maxY + BOUNDS_MARGIN,
    },
    layerCount: 1,
  }

  // Use DirectLineRouter for schematic trace routing
  const skipOtherTraceInteraction = true

  if (!edges) {
    const autorouter = new DirectLineRouter({
      input: simpleRouteJsonInput,
    })
    const results: SimplifiedPcbTrace[] = autorouter.solveAndMapToTraces()

    if (results.length === 0) {
      if (
        trace._isSymbolToChipConnection() ||
        trace._isSymbolToSymbolConnection() ||
        trace._isChipToChipConnection()
      ) {
        trace._doInitialSchematicTraceRenderWithDisplayLabel()
        return
      }
      // DirectLineRouter should always produce results for 2-point connections
      // but if it doesn't, we can't proceed
      return
    }

    const [{ route }] = results

    edges = []
    // Add autorouted path (filter out jumper routes which only apply to PCB)
    const wireAndViaRoutes = route.filter(
      (r) => r.route_type === "wire" || r.route_type === "via",
    )
    for (let i = 0; i < wireAndViaRoutes.length - 1; i++) {
      edges.push({
        from: wireAndViaRoutes[i],
        to: wireAndViaRoutes[i + 1],
      })
    }
  }

  const source_trace_id = trace.source_trace_id!

  let junctions: SchematicTrace["junctions"] = []

  if (!skipOtherTraceInteraction) {
    // Check if these edges run along any other schematic traces, if they do
    // push them out of the way
    pushEdgesOfSchematicTraceToPreventOverlap({ edges, db, source_trace_id })

    // Find all intersections between myEdges and all otherEdges and create a
    // segment representing the crossing. Wherever there's a crossing, we create
    // 3 new edges. The middle edge has `is_crossing: true` and is 0.01mm wide
    const otherEdges: SchematicTrace["edges"] = getOtherSchematicTraces({
      db,
      source_trace_id,
      differentNetOnly: true,
    }).flatMap((t: SchematicTrace) => t.edges)
    edges = createSchematicTraceCrossingSegments({ edges, otherEdges })

    // Find all the intersections between myEdges and edges connected to the
    // same net and create junction points
    // Calculate junctions where traces of the same net intersect
    junctions = createSchematicTraceJunctions({
      edges,
      db,
      source_trace_id: trace.source_trace_id!,
    })
  }

  if (!edges || edges.length === 0) {
    return
  }

  // The first/last edges sometimes don't connect to the ports because the
  // autorouter is within the "goal box" and doesn't finish the route
  // Add a stub to connect the last point to the end port
  const lastEdge = edges[edges.length - 1]
  const lastEdgePort = portsWithPosition[portsWithPosition.length - 1]
  const lastDominantDirection = getDominantDirection(lastEdge)

  // Add the connecting edges
  edges.push(...getStubEdges({ lastEdge, lastEdgePort, lastDominantDirection }))

  const firstEdge = edges[0]
  const firstEdgePort = portsWithPosition[0]
  const firstDominantDirection = getDominantDirection(firstEdge)

  // Add the connecting edges
  edges.unshift(
    ...getStubEdges({
      firstEdge,
      firstEdgePort,
      firstDominantDirection,
    }),
  )

  // Handle case where no labels are created and trace is inserted
  if (!trace.source_trace_id) {
    throw new Error("Missing source_trace_id for schematic trace insertion.")
  }

  if (
    trace.getSubcircuit()._parsedProps.schTraceAutoLabelEnabled &&
    countComplexElements(junctions, edges) >= 5 &&
    (trace._isSymbolToChipConnection() ||
      trace._isSymbolToSymbolConnection() ||
      trace._isChipToChipConnection())
  ) {
    trace._doInitialSchematicTraceRenderWithDisplayLabel()
    return
  }

  // Insert schematic trace
  const dbTrace = db.schematic_trace.insert({
    source_trace_id: trace.source_trace_id!,
    edges,
    junctions,
    subcircuit_connectivity_map_key:
      trace.subcircuit_connectivity_map_key ?? undefined,
  })
  trace.schematic_trace_id = dbTrace.schematic_trace_id

  for (const { port } of connectedPorts) {
    if (port.schematic_port_id) {
      db.schematic_port.update(port.schematic_port_id, { is_connected: true })
    }
  }

  if (board?._connectedSchematicPortPairs)
    board._connectedSchematicPortPairs.add(portPairKey)
}
