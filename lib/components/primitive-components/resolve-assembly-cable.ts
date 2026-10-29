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

function resolveAssemblyCableWaypoints({
  cable,
  from,
  to,
}: {
  cable: AssemblyCable
  from: AssemblyCableEndpoint
  to: AssemblyCableEndpoint
}): Point3[] | undefined {
  const { waypoints, waypointAnchor, waypointAxisOrientation } =
    cable._parsedProps
  if (!waypoints?.length) return waypoints
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
  return waypoints.map((waypoint) => {
    const offset = applyToPoint(boardToWorld, waypoint)
    return {
      x: anchor.x + offset.x,
      y: anchor.y + offset.y,
      z: anchor.z + waypoint.z,
    }
  })
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
    path: inferAssemblyCablePath({
      cableName: cable.name!,
      waypoints: resolveAssemblyCableWaypoints({ cable, from, to }),
      from: fromExit,
      to: toExit,
      fromDirection: from.direction,
      toDirection: to.direction,
    }),
  }
}
