import type { Point } from "@tscircuit/math-utils"
import type { SimpleRouteConnection } from "../autorouting/SimpleRouteJson"
import type { Port } from "lib/components/primitive-components/Port"
import { getRelativeDirection } from "../get-relative-direction"

interface PortWithPosition {
  port: Port
  position: Point & { layer: string }
  schematic_port_id?: string | null
  facingDirection: "up" | "down" | "left" | "right" | null
}

interface GetSchematicTraceConnectionsParams {
  startPort: PortWithPosition
  endPort: PortWithPosition
  sourceTraceId: string
}

interface GetSchematicTraceConnectionsResult {
  connections: SimpleRouteConnection[]
  wouldGoTowardsSymbol: boolean
}

/**
 * Determines the connections needed for schematic trace routing, handling cases
 * where the trace might initially route back towards the starting symbol.
 */
export function getSchematicTraceConnections({
  startPort,
  endPort,
  sourceTraceId,
}: GetSchematicTraceConnectionsParams): GetSchematicTraceConnectionsResult {
  const startPos = startPort.position
  const endPos = endPort.position
  const startDir = startPort.facingDirection

  // Determine if we need to route away from symbol
  const isStartingFromSymbol =
    !startPort.port.parent?.config.shouldRenderAsSchematicBox

  // Determine if the trace would go towards the symbol initially
  const wouldGoTowardsSymbol =
    isStartingFromSymbol &&
    startDir !== null &&
    ((startDir === "left" && endPos.x > startPos.x) ||
      (startDir === "right" && endPos.x < startPos.x) ||
      (startDir === "up" && endPos.y < startPos.y) ||
      (startDir === "down" && endPos.y > startPos.y))

  const endOffset = 0.3
  // Only apply end offset if the trace is going in the direction of endDir
  const traceDirection = getRelativeDirection(startPos, endPos)
  const endDir = endPort.facingDirection
  const shouldApplyEndOffset = traceDirection === endDir
  const adjustedEndPos = {
    x:
      endPos.x +
      (shouldApplyEndOffset && endDir === "left"
        ? -endOffset
        : shouldApplyEndOffset && endDir === "right"
          ? endOffset
          : 0),
    y:
      endPos.y +
      (shouldApplyEndOffset && endDir === "up"
        ? endOffset
        : shouldApplyEndOffset && endDir === "down"
          ? -endOffset
          : 0),
    layer: "top",
  }

  let connections: SimpleRouteConnection[]

  // Only use special routing when trace would go towards symbol
  if (wouldGoTowardsSymbol && startDir) {
    // Prevent the trace from going towards the symbol
    const straightDistance = 1 // Distance to move straight out before turning
    const useStraightDistance =
      ((startDir === "left" || startDir === "right") &&
        Math.abs(endPos.y - startPos.y) < 0.01) ||
      ((startDir === "up" || startDir === "down") &&
        Math.abs(endPos.x - startPos.x) < 0.01)

    // First intermediate point: move straight out from the port
    // This logic replicates the original calculation including useStraightDistance
    const intermediatePoint = {
      x:
        startPos.x +
        (useStraightDistance && startDir === "left"
          ? -straightDistance
          : useStraightDistance && startDir === "right"
            ? straightDistance
            : 0),
      y:
        startPos.y +
        (useStraightDistance && startDir === "up"
          ? straightDistance
          : useStraightDistance && startDir === "down"
            ? -straightDistance
            : 0),
      layer: "top",
    }

    // Second intermediate point (turn point): Replicates the original turnPoint calculation
    const turnPoint = {
      x:
        intermediatePoint.x +
        (startDir === "left" || startDir === "right"
          ? 0 // No x change if moving horizontally initially
          : endPos.x > startPos.x
            ? 0.6 // Turn right
            : -0.6), // Turn left
      y:
        intermediatePoint.y +
        (startDir === "up" || startDir === "down"
          ? 0 // No y change if moving vertically initially
          : endPos.y > startPos.y
            ? 0.6 // Turn down
            : -0.6), // Turn up
      layer: "top",
    }

    // Create three separate connections to enforce the routing path using original points
    const firstConnection: SimpleRouteConnection = {
      name: `${sourceTraceId}_1`,
      pointsToConnect: [startPos, intermediatePoint],
    }

    const secondConnection: SimpleRouteConnection = {
      name: `${sourceTraceId}_2`,
      pointsToConnect: [intermediatePoint, turnPoint],
    }

    const thirdConnection: SimpleRouteConnection = {
      name: `${sourceTraceId}_3`,
      pointsToConnect: [turnPoint, adjustedEndPos],
    }

    connections = [firstConnection, secondConnection, thirdConnection]
  } else {
    // Default case: direct connection
    const connection: SimpleRouteConnection = {
      name: sourceTraceId,
      pointsToConnect: [startPos, adjustedEndPos],
    }
    connections = [connection]
  }

  return { connections, wouldGoTowardsSymbol }
}
