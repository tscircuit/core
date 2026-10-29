import {
  getCableDefinition,
  parseCableString,
  type CableConnector,
} from "@tscircuit/cableprinter"
import type { CadCable, Point3 } from "circuit-json"
import { vec3 } from "gl-matrix"
import { applyToPoint } from "transformation-matrix"
import type { BoardDirectionVector } from "lib/utils/pcb/transform-footprint-insertion-direction"
import type { AssemblyCable } from "./AssemblyCable"
import {
  resolveAssemblyCableEndpoint,
  type AssemblyCableEndpoint,
} from "./resolve-assembly-cable-endpoint"
import { inferAssemblyCablePath } from "./infer-assembly-cable-path"

const CONNECTOR_TANGENT_LENGTH_MM = 0.1
const MIN_SEGMENT_LENGTH_MM = 1e-6
const MIN_TANGENT_LENGTH = 1e-6
const BEZIER_HANDLE_LENGTH_RATIO = 1 / 3
const CURVE_SAMPLES_PER_SPAN = 12

function resolveAuthoredAssemblyCablePath({
  cable,
  from,
  to,
  fromExit,
  toExit,
  waypoints,
}: {
  cable: AssemblyCable
  from: AssemblyCableEndpoint
  to: AssemblyCableEndpoint
  fromExit: Point3
  toExit: Point3
  waypoints: Point3[]
}): Point3[] {
  const { waypointAnchor, waypointAxisOrientation } = cable._parsedProps
  let anchor = from.position
  if (waypointAnchor === "end") anchor = to.position
  let board = from.board
  if (waypointAxisOrientation === "board_at_end") board = to.board
  if (!board) {
    let endpoint = cable._parsedProps.from
    if (waypointAxisOrientation === "board_at_end")
      endpoint = cable._parsedProps.to
    throw new Error(
      `assembly.cable "${cable.name}" endpoint "${endpoint}" has no board for waypointAxisOrientation="${waypointAxisOrientation}"`,
    )
  }
  // Paired with board placement in _computePcbGlobalTransformBeforeLayout;
  // offsets are directions, so board translation does not apply.
  const boardToWorld = {
    ...board._computePcbGlobalTransformBeforeLayout(),
    e: 0,
    f: 0,
  }
  const fromTangent = vec3.scaleAndAdd(
    vec3.create(),
    [fromExit.x, fromExit.y, fromExit.z],
    [from.direction.x, from.direction.y, from.direction.z],
    CONNECTOR_TANGENT_LENGTH_MM,
  )
  const toTangent = vec3.scaleAndAdd(
    vec3.create(),
    [toExit.x, toExit.y, toExit.z],
    [to.direction.x, to.direction.y, to.direction.z],
    CONNECTOR_TANGENT_LENGTH_MM,
  )
  const path = [
    fromExit,
    { x: fromTangent[0], y: fromTangent[1], z: fromTangent[2] },
    ...waypoints.map((waypoint) => {
      const offset = applyToPoint(boardToWorld, waypoint)
      return {
        x: anchor.x + offset.x,
        y: anchor.y + offset.y,
        z: anchor.z + waypoint.z,
      }
    }),
    { x: toTangent[0], y: toTangent[1], z: toTangent[2] },
    toExit,
  ]
  const directions: vec3[] = []
  const segmentLengths: number[] = []
  let previousDirection: vec3 | undefined
  for (let vertex = 1; vertex < path.length; vertex++) {
    const previous = path[vertex - 1]!
    const current = path[vertex]!
    const direction = vec3.subtract(
      [0, 0, 0],
      [current.x, current.y, current.z],
      [previous.x, previous.y, previous.z],
    )
    const segmentLength = vec3.length(direction)
    if (segmentLength < MIN_SEGMENT_LENGTH_MM) {
      throw new Error(
        `assembly.cable "${cable.name}" waypoints must leave distinct consecutive path points, including connector exits`,
      )
    }
    vec3.normalize(direction, direction)
    if (
      previousDirection &&
      vec3.length(vec3.add([0, 0, 0], previousDirection, direction)) <
        MIN_TANGENT_LENGTH
    ) {
      throw new Error(
        `assembly.cable "${cable.name}" waypoints must not reverse direction at a path point`,
      )
    }
    directions.push(direction)
    segmentLengths.push(segmentLength)
    previousDirection = direction
  }
  const tangents = [directions[0]!]
  // Shared unit bisectors keep joins smooth. Each span's handles stay within
  // one third of its length, so unequal spacing cannot reverse an interior span.
  for (let vertex = 2; vertex < path.length - 2; vertex++) {
    const tangent = vec3.add(
      [0, 0, 0],
      directions[vertex - 1]!,
      directions[vertex]!,
    )
    vec3.normalize(tangent, tangent)
    tangents.push(tangent)
  }
  tangents.push(directions.at(-1)!)
  const smoothPath = [path[0]!, path[1]!]
  for (let vertex = 1; vertex < path.length - 2; vertex++) {
    const start = path[vertex]!
    const end = path[vertex + 1]!
    const startPoint: vec3 = [start.x, start.y, start.z]
    const endPoint: vec3 = [end.x, end.y, end.z]
    const handleLength = segmentLengths[vertex]! * BEZIER_HANDLE_LENGTH_RATIO
    const controlA = vec3.scaleAndAdd(
      [0, 0, 0],
      startPoint,
      tangents[vertex - 1]!,
      handleLength,
    )
    const controlB = vec3.scaleAndAdd(
      [0, 0, 0],
      endPoint,
      tangents[vertex]!,
      -handleLength,
    )
    for (let sample = 1; sample < CURVE_SAMPLES_PER_SPAN; sample++) {
      const point = vec3.bezier(
        [0, 0, 0],
        startPoint,
        controlA,
        controlB,
        endPoint,
        sample / CURVE_SAMPLES_PER_SPAN,
      )
      smoothPath.push({ x: point[0], y: point[1], z: point[2] })
    }
    smoothPath.push(end)
  }
  smoothPath.push(path.at(-1)!)
  return smoothPath
}

/** Mating-face to wire-exit offset along local +Z, mm. Paired with the physical
 * connector definitions and jscad-electronics connectorWireExitDepth.
 */
const wireExitDepth = (connector: CableConnector) =>
  connector.bodyDepth +
  (connector.kind === "usb_c_plug" ? connector.shellDepth : 0)

export function resolveAssemblyCable(
  cable: AssemblyCable,
): Omit<CadCable, "type" | "cad_cable_id"> {
  const model = cable._parsedProps.model
  const explicitDefinition = model ? parseCableString(model) : undefined
  const from = resolveAssemblyCableEndpoint(
    cable,
    cable._parsedProps.from,
    explicitDefinition?.connectorA,
  )
  const to = resolveAssemblyCableEndpoint(
    cable,
    cable._parsedProps.to,
    explicitDefinition?.connectorB,
  )
  const fromDefinition =
    explicitDefinition ?? getCableDefinition(from.cableInput!)
  const toDefinition = explicitDefinition ?? getCableDefinition(to.cableInput!)
  if (from.sourceComponentId === to.sourceComponentId)
    throw new Error(
      `assembly.cable "${cable.name}" must connect two different endpoints`,
    )
  if (
    !explicitDefinition &&
    (fromDefinition.standard !== toDefinition.standard ||
      fromDefinition.connectorA.kind !== toDefinition.connectorA.kind ||
      ("pinCount" in fromDefinition.connectorA &&
        "pinCount" in toDefinition.connectorA &&
        fromDefinition.connectorA.pinCount !==
          toDefinition.connectorA.pinCount))
  )
    throw new Error(
      `assembly.cable "${cable.name}" endpoints "${cable._parsedProps.from}" and "${cable._parsedProps.to}" have incompatible connector standards or pin counts`,
    )
  if (
    cable._parsedProps.standard &&
    cable._parsedProps.standard !== fromDefinition.standard
  )
    throw new Error(
      `assembly.cable "${cable.name}" standard="${cable._parsedProps.standard}" conflicts with its endpoints`,
    )
  const definition = fromDefinition
  const endpointExit = (
    position: Point3,
    direction: BoardDirectionVector,
    depth: number,
  ) => {
    const exit = vec3.scaleAndAdd(
      vec3.create(),
      [position.x, position.y, position.z],
      [direction.x, direction.y, direction.z],
      depth,
    )
    return { x: exit[0], y: exit[1], z: exit[2] }
  }
  const fromExit = endpointExit(
    from.position,
    from.direction,
    wireExitDepth(definition.connectorA),
  )
  const toExit = endpointExit(
    to.position,
    to.direction,
    wireExitDepth(definition.connectorB),
  )
  let path: Point3[]
  const waypoints = cable._parsedProps.waypoints
  if (waypoints?.length) {
    path = resolveAuthoredAssemblyCablePath({
      cable,
      from,
      to,
      fromExit,
      toExit,
      waypoints,
    })
  } else {
    path = inferAssemblyCablePath({
      from: fromExit,
      to: toExit,
      fromDirection: from.direction,
      toDirection: to.direction,
    })
  }
  return {
    name: cable.name!,
    from_source_component_id: from.sourceComponentId,
    to_source_component_id: to.sourceComponentId,
    from_connector_pin1_position: from.pin1Position,
    to_connector_pin1_position: to.pin1Position,
    cableprinter_string:
      model ??
      ("pinCount" in definition.connectorA
        ? `${definition.standard}_pins${definition.connectorA.pinCount}`
        : definition.standard),
    path,
  }
}
