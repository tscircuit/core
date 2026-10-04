import { mat4, vec3 } from "gl-matrix"
import type { Matrix4, NamedReferencePlane } from "jscad-planner"
import type { PcbBoard } from "circuit-json"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Board } from "../normal-components/Board/Board"
import type { AssemblyMotor } from "./AssemblyMotor"
import type { AssemblyPrintedPart } from "./AssemblyPrintedPart"
import { getComponentsInAssemblyScope } from "./get-assembly-scope-components"
import type { AssemblyPlacement } from "./resolve-assembly-placement"

type MountablePart = AssemblyMotor | AssemblyPrintedPart
const isMountablePart = (part: PrimitiveComponent): part is MountablePart =>
  part.componentName === "AssemblyMotor" ||
  part.componentName === "AssemblyPrintedPart"
const isPrintedPart = (part: MountablePart): part is AssemblyPrintedPart =>
  part.componentName === "AssemblyPrintedPart"
const identity = (): Matrix4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

/** Frame-to-matrix boundary: local right-handed XYZ, mm. origin is a point;
 * normal and xAxis are unit directions. Use gl-matrix for 3D composition;
 * transformation-matrix handles the board's separate 2D PCB transform.
 */
const faceMatrix = ({
  origin,
  normal,
  xAxis,
}: NamedReferencePlane): Matrix4 => {
  const up = vec3.cross([0, 0, 0], normal, xAxis)
  return mat4.targetTo(
    identity(),
    origin,
    vec3.subtract([0, 0, 0], origin, normal),
    up,
  ) as Matrix4
}

const getFace = (
  part: MountablePart,
  faceName: string,
): NamedReferencePlane => {
  if (isPrintedPart(part)) {
    const face = part.printedPartPlan?.referencePlanes.find(
      (face) => face.name === faceName,
    )
    if (!face)
      throw new Error(
        `Printed part "${part.name}" has no reference face "${faceName}"`,
      )
    return face
  }
  if (faceName !== "backface")
    throw new Error(
      `Motor "${part.name}" only provides the backface mounting face`,
    )
  return {
    name: "backface",
    origin: [0, 0, -part.motorModel.bodyLength],
    normal: [0, 0, -1],
    xAxis: [1, 0, 0],
  }
}

const findTarget = (
  owner: PrimitiveComponent,
  selector: string,
  parts: MountablePart[],
) => {
  const separator = selector.lastIndexOf(".")
  const partName = selector.slice(0, separator)
  const faceName = selector.slice(separator + 1)
  if (separator < 1 || !faceName)
    throw new Error(
      `"${owner.name}" mountedTo must name a part and face, e.g. "SPACER.board"`,
    )
  const matches = parts.filter((part) => part.name === partName)
  if (matches.length !== 1)
    throw new Error(
      `"${owner.name}" mountedTo "${selector}" matched ${matches.length} assembly parts; expected exactly one in the assembly device`,
    )
  const part = matches[0]!
  return { part, face: getFace(part, faceName) }
}

/** World orientation paired with AssemblyMotor.resolveMotorRotation and its
 * bottom-side Y flip: local +Z is the shaft; circuit +X right, +Y top, +Z above.
 * Translations are points in mm. No authored props are modified.
 */
const rootOrientation = (part: MountablePart): Matrix4 => {
  const result = identity()
  if (isPrintedPart(part)) return result
  switch (part._parsedProps.shaftFacingDirection) {
    case "x+":
      return mat4.rotateY(result, result, Math.PI / 2) as Matrix4
    case "x-":
      return mat4.rotateY(result, result, -Math.PI / 2) as Matrix4
    case "y+":
      return mat4.rotateX(result, result, -Math.PI / 2) as Matrix4
    case "y-":
      return mat4.rotateX(result, result, Math.PI / 2) as Matrix4
    case "z-":
      return mat4.rotateY(result, result, Math.PI) as Matrix4
    default:
      return result
  }
}

/** Resolve face-to-face constraints in one assembly-device scope. A single PCB
 * anchors each connected assembly at its finalized world XY and Z=0, preserving
 * fabrication geometry. Normals oppose, X directions align, gaps follow the
 * target's outward normal. Unanchored assemblies retain their root's origin.
 */
export const resolvePrintedPartMounts = (component: PrimitiveComponent) => {
  const scoped = getComponentsInAssemblyScope(component)
  const parts = scoped.filter(isMountablePart)
  const transforms = new Map<MountablePart, Matrix4>()
  const roots = new Map<MountablePart, MountablePart>()
  const yawByRoot = new Map<MountablePart, number>()
  let subcircuitId: PcbBoard["subcircuit_id"] | undefined
  const resolvePart = (
    part: MountablePart,
    path: MountablePart[] = [],
  ): Matrix4 => {
    if (path.includes(part))
      throw new Error(
        `Assembly mounting cycle: ${[...path, part].map((part) => part.name).join(" -> ")}`,
      )
    const existing = transforms.get(part)
    if (existing) return existing
    let world = rootOrientation(part)
    let root = part
    if (isPrintedPart(part) && part._parsedProps.mountedTo) {
      const { part: target, face } = findTarget(
        part,
        part._parsedProps.mountedTo,
        parts,
      )
      const targetWorld = resolvePart(target, [...path, part])
      const sourceFace = getFace(part, part._parsedProps.mountFace!)
      const mating = faceMatrix(face)
      mat4.translate(mating, mating, [0, 0, part._parsedProps.mountGap ?? 0])
      mat4.rotateX(mating, mating, Math.PI)
      const sourceInverse = mat4.invert(identity(), faceMatrix(sourceFace))!
      world = mat4.multiply(
        identity(),
        targetWorld,
        mat4.multiply(identity(), mating, sourceInverse),
      ) as Matrix4
      root = roots.get(target)!
    }
    roots.set(part, root)
    transforms.set(part, world)
    return world
  }
  for (const part of parts) resolvePart(part)
  const anchoredRoots = new Set<MountablePart>()
  for (const board of scoped.filter(
    (part): part is Board => part.componentName === "Board",
  )) {
    if (!board._parsedProps.mountedTo) continue
    const { part, face } = findTarget(
      board,
      board._parsedProps.mountedTo,
      parts,
    )
    const root = roots.get(part)!
    if (anchoredRoots.has(root))
      throw new Error(
        `Assembly "${root.name}" has multiple mounted boards; only one board may determine its placement`,
      )
    anchoredRoots.add(root)
    if (
      !isPrintedPart(root) &&
      !["z+", "z-"].includes(root._parsedProps.shaftFacingDirection)
    )
      throw new Error(
        `Board "${board.name}" cannot mount to motor "${root.name}" facing ${root._parsedProps.shaftFacingDirection}: rotated PCB boards are not yet supported`,
      )
    const pcbBoard = board.root!.db.pcb_board.get(board.pcb_board_id!)
    if (!pcbBoard)
      throw new Error(`Mounted board "${board.name}" has no PCB geometry`)
    const worldFace = mat4.multiply(
      identity(),
      transforms.get(part)!,
      faceMatrix(face),
    ) as Matrix4
    if (Math.abs(Math.abs(worldFace[10]) - 1) > 1e-6)
      throw new Error(
        `Board "${board.name}" cannot mount to a tilted reference face; its PCB plane must remain parallel to XY`,
      )
    // Paired with the finalized board-hole transform, not authored pcbRotation.
    const boardTransform = board._computePcbGlobalTransformBeforeLayout()
    const yaw =
      Math.atan2(boardTransform.b, boardTransform.a) -
      Math.atan2(worldFace[1], worldFace[0])
    const adjustment = mat4.fromZRotation(identity(), yaw) as Matrix4
    const rotatedOrigin = vec3.transformMat4(
      [0, 0, 0],
      [worldFace[12], worldFace[13], worldFace[14]],
      adjustment,
    )
    const normalZ = worldFace[10] > 0 ? 1 : -1
    adjustment[12] = pcbBoard.center.x - rotatedOrigin[0]
    adjustment[13] = pcbBoard.center.y - rotatedOrigin[1]
    adjustment[14] =
      -normalZ * (pcbBoard.thickness / 2 + (board._parsedProps.mountGap ?? 0)) -
      rotatedOrigin[2]
    yawByRoot.set(root, yaw)
    for (const [mountedPart, world] of transforms) {
      if (roots.get(mountedPart) === root)
        transforms.set(
          mountedPart,
          mat4.multiply(identity(), adjustment, world) as Matrix4,
        )
    }
    if (
      component === board ||
      (isMountablePart(component) && roots.get(component) === root)
    )
      subcircuitId = pcbBoard.subcircuit_id
  }
  return { transforms, roots, yawByRoot, subcircuitId }
}

export const resolveMotorPrintedPartPlacement = (
  motor: AssemblyMotor,
): AssemblyPlacement | undefined => {
  const scoped = getComponentsInAssemblyScope(motor)
  if (!scoped.some((part) => part.componentName === "AssemblyPrintedPart"))
    return
  const { transforms, roots, yawByRoot, subcircuitId } =
    resolvePrintedPartMounts(motor)
  if (![...roots].some(([part, root]) => isPrintedPart(part) && root === motor))
    return
  const world = transforms.get(motor)!
  const bottom = motor._parsedProps.shaftFacingDirection === "z-"
  return {
    position: { x: world[12], y: world[13], z: world[14] },
    pcbRotation: ((yawByRoot.get(motor) ?? 0) * 180) / Math.PI,
    layer: bottom ? "bottom" : "top",
    subcircuit_id: subcircuitId,
  }
}

export const boardMountsToPrintedPart = (board: Board) => {
  const selector = board._parsedProps.mountedTo
  if (!selector) return false
  const partName = selector.slice(0, selector.lastIndexOf("."))
  return getComponentsInAssemblyScope(board).some(
    (part) =>
      part.componentName === "AssemblyPrintedPart" && part.name === partName,
  )
}
