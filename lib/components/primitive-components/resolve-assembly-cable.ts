import {
  type CableConnector,
  getAdapterCableDefinition,
  getCableDefinition,
  stringifyCableDefinition,
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
  const fromConnector =
    from.connector ?? getCableDefinition(from.cableInput!).connectorA
  const toConnector =
    to.connector ?? getCableDefinition(to.cableInput!).connectorA
  if (from.sourceComponentId === to.sourceComponentId)
    throw new Error(
      `assembly.cable "${cable.name}" must connect two different endpoints`,
    )
  if (
    cable._parsedProps.standard &&
    cable._parsedProps.standard !== "adaptercable" &&
    (fromConnector.kind !== "usb_c_plug" || toConnector.kind !== "usb_c_plug")
  )
    throw new Error(
      `assembly.cable "${cable.name}" standard="${cable._parsedProps.standard}" conflicts with its endpoints`,
    )
  const definition = (() => {
    try {
      return getAdapterCableDefinition({
        connectorA: fromConnector,
        connectorB: toConnector,
      })
    } catch (cause) {
      throw new Error(
        `assembly.cable "${cable.name}" endpoints "${cable._parsedProps.from}" and "${cable._parsedProps.to}" have incompatible connector pin counts or wire dimensions`,
        { cause },
      )
    }
  })()
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
    cableprinter_string: stringifyCableDefinition(definition, {
      useShorthand: cable._parsedProps.standard !== "adaptercable",
    }),
    path: inferAssemblyCablePath({
      from: fromExit,
      to: toExit,
      fromDirection: from.direction,
      toDirection: to.direction,
    }),
  }
}
