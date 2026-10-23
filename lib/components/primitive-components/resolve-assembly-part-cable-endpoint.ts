import type { CableConnector } from "@tscircuit/cableprinter"
import { mat3, vec3 } from "gl-matrix"
import type { AssemblyCable } from "./AssemblyCable"
import type { AssemblyPart } from "./AssemblyPart"
import type { AssemblyPrintedPart } from "./AssemblyPrintedPart"
import type { AssemblyCableEndpoint } from "./resolve-assembly-cable-endpoint"
import { getComponentsInAssemblyScope } from "./get-assembly-scope-components"
import { getPartReferenceSurfaces } from "./get-part-reference-surfaces"
import { matchesAssemblyIdentity } from "./matches-assembly-identity"
import { parseAssemblyReferenceSelector } from "./parse-assembly-reference-selector"
import { resolvePrintedPartMounts } from "./resolve-printed-part-mounts"

/** Named part references are local mating frames, in right-handed XYZ mm.
 * Use the same mounting transform as CAD/reference rendering to return circuit
 * world (+X right, +Y top, +Z above). Origins are points, normals/X axes are
 * directions. The reference's +X points from pin 1 toward the last contact.
 */
export const resolveAssemblyPartCableEndpoint = ({
  cable,
  selector,
  cableConnector,
}: {
  cable: AssemblyCable
  selector: string
  cableConnector?: CableConnector
}): AssemblyCableEndpoint | undefined => {
  const referenceSelector = parseAssemblyReferenceSelector(selector)
  if (!referenceSelector) return
  const parts = getComponentsInAssemblyScope(cable).filter(
    (part): part is AssemblyPart | AssemblyPrintedPart =>
      (part.componentName === "AssemblyPart" ||
        part.componentName === "AssemblyPrintedPart") &&
      matchesAssemblyIdentity(part, referenceSelector.partName),
  )
  if (!parts.length) return
  if (parts.length !== 1)
    throw new Error(
      `assembly.cable "${cable.name}" endpoint "${selector}" must match exactly one part in its assembly device`,
    )
  const part = parts[0]!
  const surface = getPartReferenceSurfaces(part).find(
    (surface) => surface.name === referenceSelector.faceName,
  )
  if (!surface)
    throw new Error(
      `assembly.cable "${cable.name}" part "${part.name}" has no reference surface "${referenceSelector.faceName}"`,
    )
  if (!cableConnector)
    throw new Error(
      `assembly.cable "${cable.name}" endpoint "${selector}" requires an explicit model to define its connector`,
    )
  const { transforms } = resolvePrintedPartMounts(cable)
  const partToWorld = transforms.get(part)!
  const partToWorldRotation = mat3.fromMat4(mat3.create(), partToWorld)
  const position = vec3.transformMat4(
    vec3.create(),
    surface.origin,
    partToWorld,
  )
  const direction = vec3.normalize(
    vec3.create(),
    vec3.transformMat3(vec3.create(), surface.normal, partToWorldRotation),
  )
  let pin1Position: AssemblyCableEndpoint["pin1Position"]
  if ("pinCount" in cableConnector) {
    const xAxis = vec3.normalize(
      vec3.create(),
      vec3.transformMat3(vec3.create(), surface.xAxis, partToWorldRotation),
    )
    const pin1 = vec3.scaleAndAdd(
      vec3.create(),
      position,
      xAxis,
      -((cableConnector.pinCount - 1) * cableConnector.pitch) / 2,
    )
    pin1Position = { x: pin1[0], y: pin1[1], z: pin1[2] }
  }
  return {
    sourceComponentId: part.source_component_id!,
    position: { x: position[0], y: position[1], z: position[2] },
    direction: { x: direction[0], y: direction[1], z: direction[2] },
    pin1Position,
  }
}
