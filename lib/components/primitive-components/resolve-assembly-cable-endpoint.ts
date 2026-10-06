import type { CableInput } from "@tscircuit/cableprinter"
import type { Point3, SourceComponentBase } from "circuit-json"
import { mat4, vec3 } from "gl-matrix"
import { selectAll } from "css-select"
import { NormalComponent } from "../base-components/NormalComponent"
import { cssSelectPrimitiveComponentAdapter } from "../base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { preprocessSelector } from "../base-components/PrimitiveComponent/preprocessSelector"
import type { BoardDirectionVector } from "lib/utils/pcb/transform-footprint-insertion-direction"
import type { AssemblyCable } from "./AssemblyCable"
import type { AssemblyMotor } from "./AssemblyMotor"
import type { ConnectorProps } from "@tscircuit/props"
import {
  getAssemblyScope,
  getComponentsInAssemblyScope,
} from "./get-assembly-scope-components"
import { resolveMotorFaceMount } from "./resolve-motor-face-mount"
import type { AssemblyPlacement } from "./resolve-assembly-placement"
import { resolveAssemblyMotorPlacement } from "./resolve-assembly-motor-placement"
import { resolveAssemblyMotorRotation } from "./resolve-assembly-motor-rotation"
import { resolveAssemblyCablePin1Position } from "./resolve-assembly-cable-pin1-position"

/** Connector mating-center point and outward unit direction in right-handed
 * circuit world, mm (+X right, +Y top, +Z above). Points acquire translation;
 * directions do not. CableInput describes the physical interface, not a route.
 */
export interface AssemblyCableEndpoint {
  sourceComponentId: SourceComponentBase["source_component_id"]
  position: Point3
  pin1Position?: Point3
  direction: BoardDirectionVector
  cableInput: CableInput
}

export function resolveAssemblyCableEndpoint(
  cable: AssemblyCable,
  selector: string,
): AssemblyCableEndpoint {
  const scoped = getComponentsInAssemblyScope(cable)
  const motorReference = selector.match(/^(.+)\.wireside$/)
  if (motorReference) {
    const motors = scoped.filter(
      (part): part is AssemblyMotor =>
        part.componentName === "AssemblyMotor" &&
        part.name === motorReference[1],
    )
    if (motors.length !== 1)
      throw new Error(
        `assembly.cable "${cable.name}" endpoint "${selector}" must match exactly one motor in its assembly device`,
      )
    const motor = motors[0]!
    if (motor.motorModel.wireConnection !== "jst-ph-6")
      throw new Error(
        `assembly.cable "${cable.name}" requires motor "${motor.name}" to have wireConnection="jst-ph-6" for its connector endpoint`,
      )
    const faceMount = resolveMotorFaceMount(motor)
    const placement: AssemblyPlacement = faceMount
      ? { position: faceMount.position, pcbRotation: 0, layer: "top" }
      : resolveAssemblyMotorPlacement(motor)
    const offset =
      faceMount?.rotation ?? resolveAssemblyMotorRotation(motor, placement)
    // Paired with renderAssemblyCadModel's CAD intrinsic XYZ (Rx*Ry*Rz),
    // including its bottom-layer Y turn and signed board-plane Z angle.
    const orientation = mat4.create()
    const bottom = placement.layer === "bottom"
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
    const reference = motor.motorReferencePoints.wireside
    const direction = vec3.transformMat4(
      vec3.create(),
      [reference.direction.x, reference.direction.y, reference.direction.z],
      orientation,
    )
    const point = vec3.transformMat4(
      vec3.create(),
      [reference.position.x, reference.position.y, reference.position.z],
      orientation,
    )
    // createNemaMotorWireGeometry places the PH6 pin row along local +Y
    // before wireSideAngle rotation; pin 1 is at -5 mm on that row.
    // The wireside reference applies the same rotation about local Z.
    const pin1Offset = vec3.transformMat4(
      vec3.create(),
      [reference.direction.y * 5, -reference.direction.x * 5, 0],
      orientation,
    )
    // NEMA's PH header mating face is 6 mm beyond its body-side reference,
    // as specified by jscad-electronics createNemaMotorWireGeometry.
    return {
      sourceComponentId: motor.source_component_id!,
      position: {
        x: point[0] + placement.position.x + direction[0] * 6,
        y: point[1] + placement.position.y + direction[1] * 6,
        z: point[2] + placement.position.z + direction[2] * 6,
      },
      pin1Position: {
        x: point[0] + placement.position.x + direction[0] * 6 + pin1Offset[0],
        y: point[1] + placement.position.y + direction[1] * 6 + pin1Offset[1],
        z: point[2] + placement.position.z + direction[2] * 6 + pin1Offset[2],
      },
      direction: { x: direction[0], y: direction[1], z: direction[2] },
      cableInput: { standard: "jst_ph", pinCount: 6 },
    }
  }
  const scope = getAssemblyScope(cable)
  const matches = selectAll(preprocessSelector(selector, cable), scope, {
    adapter: cssSelectPrimitiveComponentAdapter,
  }).filter((part) => scoped.includes(part))
  if (matches.length !== 1)
    throw new Error(
      `assembly.cable "${cable.name}" endpoint "${selector}" matched ${matches.length} components; expected exactly one in its assembly device`,
    )
  const connector = matches[0]!
  if (
    !(connector instanceof NormalComponent) ||
    connector.componentName !== "Connector" ||
    !connector.pcb_component_id ||
    !connector.source_component_id
  )
    throw new Error(
      `assembly.cable "${cable.name}" endpoint "${selector}" must name a PCB connector or MOTOR.wireside`,
    )
  const props = connector._parsedProps as ConnectorProps
  if (
    props.standard !== "usb_c" &&
    props.standard !== "jst_sh" &&
    props.standard !== "jst_ph"
  )
    throw new Error(
      `assembly.cable "${cable.name}" cannot infer endpoint "${selector}"; use a connector with standard="usb_c", "jst_sh", or "jst_ph"`,
    )
  const pcb = cable.root!.db.pcb_component.get(connector.pcb_component_id)!
  const board = connector._getBoard()!
  const layer = pcb.layer === "bottom" ? "bottom" : "top"
  const inferredCenter = pcb.cable_insertion_center ?? pcb.center
  const inferredDirection = vec3.normalize(vec3.create(), [
    inferredCenter.x - pcb.center.x,
    inferredCenter.y - pcb.center.y,
    0,
  ])
  const direction =
    connector._getPcbComponentInsertionAxisDirection(layer, pcb.rotation) ??
    (props.standard === "usb_c" && vec3.length(inferredDirection) > 0
      ? { x: inferredDirection[0], y: inferredDirection[1], z: 0 }
      : { x: 0, y: 0, z: layer === "bottom" ? -1 : 1 })
  // A 2D boundary guess is meaningful for a side-entry USB port. Stock JST
  // headers are top-entry; their mating center is over the component origin.
  const center = Math.abs(direction.z) > 0.5 ? pcb.center : inferredCenter
  const sign = layer === "bottom" ? -1 : 1
  // Top-entry header mouths: JST PH BxB-PH is 6 mm; SH BMxxB is
  // 4.25 mm above copper, paired with jscad-electronics' header models.
  const height =
    Math.abs(direction.z) > 0.5
      ? props.standard === "jst_ph"
        ? 6
        : props.standard === "jst_sh"
          ? 4.25
          : 1.5
      : props.standard === "usb_c"
        ? 1.5
        : props.standard === "jst_sh"
          ? 1.4
          : 2.25
  const position = {
    x: center.x,
    y: center.y,
    z: sign * (board.boardThickness / 2 + height),
  }
  return {
    sourceComponentId: connector.source_component_id,
    position,
    pin1Position: resolveAssemblyCablePin1Position(
      cable,
      connector,
      position,
      direction,
    ),
    direction,
    cableInput:
      props.standard === "usb_c"
        ? { standard: "usb_c" }
        : { standard: props.standard, pinCount: props.pinCount },
  }
}
