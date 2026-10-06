import { cadModelBase, point3 } from "@tscircuit/props"
import type { ParsedAssemblyCableConnectorProps } from "@tscircuit/props"
import { rotation } from "circuit-json"
import { mat4, vec3 } from "gl-matrix"
import type { AssemblySubassembly } from "./AssemblySubassembly"
import type { AssemblyCableEndpoint } from "./resolve-assembly-cable-endpoint"
import { resolveAssemblyModel } from "./resolve-assembly-model"
import { resolveAssemblyPlacement } from "./resolve-assembly-placement"

/** Connector point and outward axis: model-local physical mm relative to the
 * CAD placement anchor -> right-handed circuit world (+X right,+Y top,+Z above).
 * Physical connector offsets are already mm; mesh units/object-fit don't scale
 * them. Points acquire translation; directions acquire only orientation.
 */
export function resolveCadAssemblyCableEndpoint(
  owner: AssemblySubassembly,
  connector: ParsedAssemblyCableConnectorProps,
): AssemblyCableEndpoint {
  const placement = resolveAssemblyPlacement(owner)
  const model =
    resolveAssemblyModel(owner._parsedProps) ?? owner._parsedProps.cadModel
  if (!model || (typeof model === "object" && "type" in model))
    throw new Error(
      `Assembly "${owner.name}" cable connectors require CAD geometry on the assembly itself`,
    )
  const base = cadModelBase.parse(typeof model === "string" ? {} : model)
  const authored = base.pcbRotationOffset ?? base.rotationOffset ?? 0
  const offset =
    typeof authored === "number"
      ? { x: 0, y: 0, z: authored }
      : {
          x: rotation.parse(authored.x),
          y: rotation.parse(authored.y),
          z: rotation.parse(authored.z),
        }
  const bottom = placement.layer === "bottom"
  // Paired with renderAssemblyCadModel's emitted intrinsic XYZ (Rx*Ry*Rz),
  // and the existing motor endpoint's transform in resolveAssemblyCableEndpoint.
  const orientation = mat4.create()
  mat4.rotateX(orientation, orientation, (offset.x * Math.PI) / 180)
  mat4.rotateY(
    orientation,
    orientation,
    ((offset.y + (bottom ? 180 : 0)) * Math.PI) / 180,
  )
  mat4.rotateZ(
    orientation,
    orientation,
    ((bottom ? -1 : 1) * (placement.pcbRotation + offset.z) * Math.PI) / 180,
  )
  const point = vec3.transformMat4(
    vec3.create(),
    [connector.position.x, connector.position.y, connector.position.z],
    orientation,
  )
  const axis = {
    "x+": [1, 0, 0],
    "x-": [-1, 0, 0],
    "y+": [0, 1, 0],
    "y-": [0, -1, 0],
    "z+": [0, 0, 1],
    "z-": [0, 0, -1],
  }[connector.facingDirection]!
  const direction = vec3.transformMat4(
    vec3.create(),
    axis as [number, number, number],
    orientation,
  )
  const positionOffset = point3.parse(
    base.positionOffset ?? { x: 0, y: 0, z: 0 },
  )
  // positionOffset is assembly-local, composed by renderAssemblyCadModel before
  // the CAD's authored rotation. Use that same PCB plane rotation and Y flip.
  const placementOrientation = mat4.create()
  mat4.rotateZ(
    placementOrientation,
    placementOrientation,
    (placement.pcbRotation * Math.PI) / 180,
  )
  if (bottom) mat4.rotateY(placementOrientation, placementOrientation, Math.PI)
  const translation = vec3.transformMat4(
    vec3.create(),
    [
      positionOffset.x,
      positionOffset.y,
      positionOffset.z + (base.zOffsetFromSurface ?? 0),
    ],
    placementOrientation,
  )
  const opposite = connector.bulletGender === "male" ? "female" : "male"
  return {
    sourceComponentId: owner.source_component_id!,
    position: {
      x: placement.position.x + translation[0] + point[0],
      y: placement.position.y + translation[1] + point[1],
      z: placement.position.z + translation[2] + point[2],
    },
    direction: { x: direction[0], y: direction[1], z: direction[2] },
    cableInput: {
      standard: "bullet",
      diameter: connector.bulletDiameter,
      genderA: opposite,
      genderB: opposite,
      pinCount: connector.pinCount ?? 1,
    },
  }
}
