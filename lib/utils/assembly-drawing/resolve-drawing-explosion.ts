import type {
  AnyCircuitElement,
  DrawingExplosionMove,
  CadComponent,
} from "circuit-json"
import type { AssemblyDrawingExplosionView } from "lib/components/primitive-components/AssemblyDrawingExplosionView"
import {
  assemblyPath,
  resolveAssemblyExplosionStages,
} from "lib/assembly-explosion/get-assembly-explosion"
import { getCircuitJsonAssemblyExplosion } from "lib/assembly-explosion/get-circuit-json-assembly-explosion"
import type { Board } from "lib/components/normal-components/Board/Board"
import type { DrawingMembership } from "./resolve-drawing-stage-selection"

type SourceComponentId = CadComponent["source_component_id"]

/** Flatten existing ordered assembly playback to simultaneous displacement vectors
 * from assembled CAD world points: right-handed XYZ, +X right/+Y top/+Z above,
 * millimeters. Preserve assembled input; drawing factor is applied only by consumers. */
export function resolveDrawingExplosion(
  view: AssemblyDrawingExplosionView,
  assembled: AnyCircuitElement[],
) {
  let scope = view.parent
  while (
    scope &&
    !["AssemblyDevice", "AssemblySubassembly"].includes(scope.componentName)
  )
    scope = scope.parent
  if (!scope) throw new Error("An explosion view requires an owning assembly")
  const reference = view._parsedProps.stageRef
  const ownerPath = assemblyPath(scope)
  const stages = resolveAssemblyExplosionStages(view.root!.children)
  const matches = stages.filter((stage) => {
    const name = `${assemblyPath(stage.parent!)}.${stage.name}`
    return (
      name === `${ownerPath}.${reference}` ||
      (reference.startsWith(`${ownerPath.split(".")[0]}.`) &&
        name === reference)
    )
  })
  if (matches.length !== 1)
    throw new Error(
      `Explosion view stageRef "${reference}" must reference exactly one assembly.explosion.stage`,
    )
  const stage = matches[0]!
  if (
    !stage.children.some(
      (child) =>
        child.componentName === "AssemblyExplosionMove" &&
        !child.shouldBeRemoved,
    )
  )
    throw new Error(`Explosion stage "${stage.name}" has no moves to draw`)
  const owner = stage.parent!
  const sources = new Set(
    [owner, ...owner.getDescendants()]
      .filter((part) => !part.shouldBeRemoved)
      .map((part) => part.source_component_id)
      .filter(Boolean),
  )
  const cad = assembled.filter(
    (part): part is CadComponent =>
      part.type === "cad_component" && sources.has(part.source_component_id),
  )
  const posed = getCircuitJsonAssemblyExplosion(assembled, {
    throughStageRef: `${assemblyPath(owner)}.${stage.name}`,
  }).circuitJson
  const posedCad = new Map(
    posed
      .filter((part) => part.type === "cad_component")
      .map((part) => [part.cad_component_id, part]),
  )
  const translations = new Map<
    SourceComponentId,
    DrawingExplosionMove["translation"]
  >()
  for (const part of cad) {
    const end = posedCad.get(part.cad_component_id)!.position
    const translation = {
      x: end.x - part.position.x,
      y: end.y - part.position.y,
      z: end.z - part.position.z,
    }
    const prior = translations.get(part.source_component_id)
    if (
      prior &&
      ["x", "y", "z"].some(
        (axis) =>
          Math.abs(
            prior[axis as keyof typeof prior] -
              translation[axis as keyof typeof translation],
          ) > 1e-7,
      )
    )
      throw new Error(
        `Explosion stage "${stage.name}" gives one part conflicting drawing displacements`,
      )
    translations.set(part.source_component_id, translation)
  }
  const boards = [owner, ...owner.getDescendants()].filter(
    (part): part is Board =>
      part.componentName === "Board" && !part.shouldBeRemoved,
  )
  const membership: DrawingMembership = {
    source_component_ids: [...translations.keys()],
    pcb_board_ids: boards.flatMap((board) =>
      board.pcb_board_id ? [board.pcb_board_id] : [],
    ),
  }
  if (!translations.size)
    throw new Error(`Explosion stage "${stage.name}" has no drawable parts`)
  const moves: DrawingExplosionMove[] = [...translations].map(
    ([source, translation]) => ({
      source_component_ids: [source],
      translation,
    }),
  )
  const factor = view._parsedProps.factor
  const dimensionGeometry = assembled.map((part) => {
    if (part.type !== "cad_component" && part.type !== "cad_reference_surface")
      return part
    const translation = translations.get(part.source_component_id)
    if (!translation) return part
    const point = part.type === "cad_component" ? part.position : part.center
    const shifted = {
      x: point.x + translation.x * factor,
      y: point.y + translation.y * factor,
      z: point.z + translation.z * factor,
    }
    return part.type === "cad_component"
      ? { ...part, position: shifted }
      : { ...part, center: shifted }
  })
  return { stage, membership, moves, dimensionGeometry }
}
