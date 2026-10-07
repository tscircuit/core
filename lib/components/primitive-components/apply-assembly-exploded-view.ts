import type {
  ExplodeDirection,
  ExplodeDirectionName,
  ExplodeDirectionVector,
} from "@tscircuit/props"
import type { CadComponent, Point3, SourceComponentBase } from "circuit-json"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { AssemblyDevice } from "./AssemblyDevice"

export type CadComponentId = CadComponent["cad_component_id"]
type SourceComponentId = SourceComponentBase["source_component_id"]
type AssemblyPartName = string

const namedDirectionVectors: Record<
  ExplodeDirectionName,
  ExplodeDirectionVector
> = {
  right: { x: 1, y: 0, z: 0 },
  left: { x: -1, y: 0, z: 0 },
  top: { x: 0, y: 1, z: 0 },
  bottom: { x: 0, y: -1, z: 0 },
  above: { x: 0, y: 0, z: 1 },
  below: { x: 0, y: 0, z: -1 },
}

/** Convert an authored circuit-world direction into a unit direction.
 * +X is right, +Y is top, and +Z is above the board. Directions are
 * unitless and do not receive translation.
 */
const normalizeExplodeDirection = (
  direction: ExplodeDirection,
): ExplodeDirectionVector => {
  const directionVector =
    typeof direction === "string" ? namedDirectionVectors[direction] : direction
  const magnitude = Math.hypot(
    directionVector.x,
    directionVector.y,
    directionVector.z,
  )
  return {
    x: directionVector.x / magnitude,
    y: directionVector.y / magnitude,
    z: directionVector.z / magnitude,
  }
}

const getAssemblyParts = (
  assemblyDevice: AssemblyDevice,
): PrimitiveComponent[] => {
  const assemblyParts: PrimitiveComponent[] = []
  const remainingAssemblyParts = [...assemblyDevice.children]
  while (remainingAssemblyParts.length > 0) {
    const assemblyPart = remainingAssemblyParts.pop()!
    assemblyParts.push(assemblyPart)

    // A nested device owns the exploded-view props inside its own subtree.
    if (assemblyPart.componentName !== "AssemblyDevice") {
      remainingAssemblyParts.push(...assemblyPart.children)
    }
  }
  return assemblyParts
}

const getAssemblyPartSourceComponentIds = (
  assemblyPart: PrimitiveComponent,
): Set<SourceComponentId> => {
  const sourceComponentIds = new Set<SourceComponentId>()
  const remainingAssemblyParts = [assemblyPart]
  while (remainingAssemblyParts.length > 0) {
    const currentAssemblyPart = remainingAssemblyParts.pop()!
    if (currentAssemblyPart.source_component_id) {
      sourceComponentIds.add(currentAssemblyPart.source_component_id)
    }
    remainingAssemblyParts.push(...currentAssemblyPart.children)
  }
  return sourceComponentIds
}

/** Apply the authored full-explosion offsets to CAD records. The offset is a
 * displacement vector in right-handed circuit-world millimeters, not a point.
 * The assembled CAD position remains unchanged.
 */
export const applyAssemblyExplodedView = ({
  assemblyDevice,
  previousCadComponentIds,
}: {
  assemblyDevice: AssemblyDevice
  previousCadComponentIds: Set<CadComponentId>
}): Set<CadComponentId> => {
  const { root } = assemblyDevice
  if (!root || root.pcbDisabled) return new Set()

  for (const cadComponentId of previousCadComponentIds) {
    root.db.cad_component.update(cadComponentId, {
      explode_offset: undefined,
    })
  }

  const configuredPartNamesByCadComponentId = new Map<
    CadComponentId,
    AssemblyPartName
  >()

  for (const assemblyPart of getAssemblyParts(assemblyDevice)) {
    const { explodeDirection: direction, explodeDistance: distance } =
      assemblyPart._parsedProps as {
        explodeDirection?: ExplodeDirection
        explodeDistance?: number
      }
    const hasDirection = direction !== undefined
    const hasDistance = distance !== undefined
    if (!hasDirection && !hasDistance) continue

    const assemblyPartName = assemblyPart.name
    if (!hasDirection || !hasDistance) {
      throw new Error(
        `Assembly part "${assemblyPartName}" must provide explodeDirection and explodeDistance together`,
      )
    }

    const sourceComponentIds = getAssemblyPartSourceComponentIds(assemblyPart)
    const cadComponents = root.db.cad_component
      .list()
      .filter((cadComponent) =>
        sourceComponentIds.has(cadComponent.source_component_id),
      )

    if (cadComponents.length === 0) {
      throw new Error(
        `Assembly part "${assemblyPartName}" has exploded-view props but no CAD geometry`,
      )
    }

    const normalizedDirection = normalizeExplodeDirection(direction)
    const explodeOffset: Point3 = {
      x: normalizedDirection.x * distance,
      y: normalizedDirection.y * distance,
      z: normalizedDirection.z * distance,
    }

    for (const cadComponent of cadComponents) {
      const previousPartName = configuredPartNamesByCadComponentId.get(
        cadComponent.cad_component_id,
      )
      if (previousPartName) {
        throw new Error(
          `Assembly parts "${previousPartName}" and "${assemblyPartName}" assign exploded-view travel to the same CAD geometry`,
        )
      }
      configuredPartNamesByCadComponentId.set(
        cadComponent.cad_component_id,
        assemblyPartName,
      )
      root.db.cad_component.update(cadComponent.cad_component_id, {
        explode_offset: explodeOffset,
      })
    }
  }

  return new Set(configuredPartNamesByCadComponentId.keys())
}
