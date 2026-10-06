import {
  type CableConnector,
  getCableDefinition,
} from "@tscircuit/cableprinter"
import type { CadCable, Point3 } from "circuit-json"
import { vec3 } from "gl-matrix"
import type { BoardDirectionVector } from "lib/utils/pcb/transform-footprint-insertion-direction"
import type { AssemblyCable } from "./AssemblyCable"
import { inferAssemblyCablePath } from "./infer-assembly-cable-path"
import { resolveAssemblyCableEndpoint } from "./resolve-assembly-cable-endpoint"

/** Mating-face to wire-exit offset along local +Z, mm. Paired with the physical
 * connector definitions and jscad-electronics connectorWireExitDepth.
 */
const wireExitDepth = (connector: CableConnector) =>
  connector.bodyDepth +
  (connector.kind === "usb_c_plug" ? connector.shellDepth : 0)

export function resolveAssemblyCable(
  cable: AssemblyCable,
): Omit<CadCable, "type" | "cad_cable_id"> {
  const from = resolveAssemblyCableEndpoint(cable, cable._parsedProps.from)
  const to = resolveAssemblyCableEndpoint(cable, cable._parsedProps.to)
  const fromDefinition = getCableDefinition(from.cableInput)
  const toDefinition = getCableDefinition(to.cableInput)
  if (from.sourceComponentId === to.sourceComponentId)
    throw new Error(
      `assembly.cable "${cable.name}" must connect two different endpoints`,
    )
  if (
    fromDefinition.standard !== toDefinition.standard ||
    (fromDefinition.standard !== "bullet" &&
      fromDefinition.connectorA.kind !== toDefinition.connectorA.kind) ||
    ("pinCount" in fromDefinition.connectorA &&
      "pinCount" in toDefinition.connectorA &&
      fromDefinition.connectorA.pinCount !== toDefinition.connectorA.pinCount)
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
  const definition =
    fromDefinition.standard === "bullet" &&
    "diameter" in fromDefinition.connectorA &&
    "diameter" in toDefinition.connectorA
      ? getCableDefinition({
          standard: "bullet",
          diameterA: fromDefinition.connectorA.diameter,
          diameterB: toDefinition.connectorA.diameter,
          pinCount: fromDefinition.connectorA.pinCount,
          genderA:
            fromDefinition.connectorA.kind === "bullet_male"
              ? "male"
              : "female",
          genderB:
            toDefinition.connectorA.kind === "bullet_male" ? "male" : "female",
        })
      : { ...fromDefinition, connectorB: toDefinition.connectorA }
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
    cableprinter_string:
      definition.standard === "bullet" && "diameter" in definition.connectorA
        ? `bullet${definition.connectorA.pinCount === 1 ? "" : definition.connectorA.pinCount}_${"diameter" in definition.connectorB && definition.connectorA.diameter !== definition.connectorB.diameter ? `da${definition.connectorA.diameter}mm_db${definition.connectorB.diameter}mm` : `d${definition.connectorA.diameter}mm`}_a${definition.connectorA.kind === "bullet_male" ? "male" : "female"}_b${definition.connectorB.kind === "bullet_male" ? "male" : "female"}`
        : "pinCount" in definition.connectorA
          ? `${definition.standard}_pins${definition.connectorA.pinCount}`
          : definition.standard,
    path: inferAssemblyCablePath({
      from: fromExit,
      to: toExit,
      fromDirection: from.direction,
      toDirection: to.direction,
    }),
  }
}
