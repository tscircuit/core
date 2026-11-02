import { selectAll, type Options } from "css-select"
import type { NamedReferencePlane } from "jscad-planner"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { cssSelectPrimitiveComponentAdapter } from "../base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { preprocessSelector } from "../base-components/PrimitiveComponent/preprocessSelector"
import type { AssemblyMotor } from "./AssemblyMotor"
import type { AssemblyPart } from "./AssemblyPart"
import type { AssemblyPrintedPart } from "./AssemblyPrintedPart"
import type { AssemblySubassembly } from "./AssemblySubassembly"
import {
  getAssemblyScope,
  getComponentsInAssemblyScope,
} from "./get-assembly-scope-components"
import { getPartReferenceSurfaces } from "./get-part-reference-surfaces"
import { matchesAssemblyIdentity } from "./matches-assembly-identity"

export type AssemblyMountPart =
  | AssemblyMotor
  | AssemblyPart
  | AssemblyPrintedPart
  | AssemblySubassembly

export const isAssemblyMountPart = (
  part: PrimitiveComponent,
): part is AssemblyMountPart =>
  [
    "AssemblyMotor",
    "AssemblyPart",
    "AssemblyPrintedPart",
    "AssemblySubassembly",
  ].includes(part.componentName)

/** Owner-local, right-handed XYZ in mm, +Z up. Origins are points; normals
 * and in-plane X axes are directions. Model alignment does not move datums.
 */
const facesFor = (part: AssemblyMountPart): NamedReferencePlane[] => {
  if (part.componentName !== "AssemblyMotor")
    return getPartReferenceSurfaces(
      part as AssemblyPart | AssemblyPrintedPart | AssemblySubassembly,
    )
  const motor = part as AssemblyMotor
  return ["frontface", "backface"].map<NamedReferencePlane>((name) => ({
    name,
    origin: [0, 0, name === "backface" ? -motor.motorModel.bodyLength : 0],
    normal: [0, 0, name === "backface" ? -1 : 1],
    xAxis: [1, 0, 0],
  }))
}

interface MountSelectorNode {
  component?: PrimitiveComponent
  parent?: MountSelectorNode
  children: MountSelectorNode[]
  part?: AssemblyMountPart
  face?: NamedReferencePlane
}

const descendants = (nodes: MountSelectorNode[]): MountSelectorNode[] =>
  nodes.flatMap((node) => [node, ...descendants(node.children)])

const attribute = (node: MountSelectorNode, name: string) =>
  node.component
    ? (cssSelectPrimitiveComponentAdapter!.getAttributeValue(
        node.component,
        name,
      ) ?? undefined)
    : name === "class" || name === "name"
      ? node.face?.name
      : undefined

const adapter: Required<
  Options<MountSelectorNode, MountSelectorNode>["adapter"]
> = {
  isTag: (node): node is MountSelectorNode => true,
  getParent: (node) => node.parent ?? null,
  getChildren: (node) => node.children,
  getName: (node) =>
    node.component?.lowercaseComponentName ?? "assemblyreferencesurface",
  getAttributeValue: attribute,
  hasAttrib: (node, name) => attribute(node, name) != null,
  getSiblings: (node) => node.parent?.children ?? [node],
  prevElementSibling: (node) => {
    const siblings = node.parent?.children ?? []
    return siblings[siblings.indexOf(node) - 1] ?? null
  },
  getText: () => "",
  removeSubsets: (nodes) =>
    nodes.filter((node) => {
      let parent = node.parent
      while (parent) {
        if (nodes.includes(parent)) return false
        parent = parent.parent
      }
      return true
    }),
  existsOne: (test, nodes) => descendants(nodes).some(test),
  findAll: (test, nodes) => descendants(nodes).filter(test),
  findOne: (test, nodes) => descendants(nodes).find(test) ?? null,
  equals: (a, b) => a === b,
  isHovered: () => false,
  isVisited: () => false,
  isActive: () => false,
}

/** A read-only selector view includes named JSCAD/NEMA faces as virtual leaf
 * nodes, so CSS works for generated datums as well as explicit JSX children.
 * It never mutates the component tree or inserts geometry into the circuit.
 */
const selectorTree = (
  scope: PrimitiveComponent,
  parts: AssemblyMountPart[],
) => {
  const allowed = new Set(getComponentsInAssemblyScope(scope))
  const owners = new Set(parts)
  const build = (
    component: PrimitiveComponent,
    parent?: MountSelectorNode,
  ): MountSelectorNode => {
    const node: MountSelectorNode = { component, parent, children: [] }
    node.children = component.children
      .filter((child) => allowed.has(child))
      .map((child) => build(child, node))
    if (isAssemblyMountPart(component) && owners.has(component)) {
      for (const face of facesFor(component)) {
        const child = node.children.find(
          (child) =>
            child.component?.componentName === "AssemblyReferenceSurface" &&
            child.component.name === face.name,
        )
        if (child) {
          child.part = component
          child.face = face
        } else
          node.children.push({
            parent: node,
            children: [],
            part: component,
            face,
          })
      }
    }
    return node
  }
  return build(scope)
}

const selectFaces = (
  owner: PrimitiveComponent,
  reference: string,
  scope: PrimitiveComponent,
  parts: AssemblyMountPart[],
) => {
  const tree = selectorTree(scope, parts)
  try {
    return selectAll(preprocessSelector(reference, owner), [tree], {
      adapter,
    }).flatMap((node) =>
      node.part && node.face ? [{ part: node.part, face: node.face }] : [],
    )
  } catch {
    throw new Error(
      `"${owner.name}" has an invalid mounting selector "${reference}"`,
    )
  }
}

export const resolveAssemblyMountFace = (
  part: AssemblyMountPart,
  reference: string,
): NamedReferencePlane => {
  const named = facesFor(part).find((face) => face.name === reference)
  if (named) return named
  const matches = selectFaces(part, reference, part, [part]).filter(
    (match) => match.part === part,
  )
  if (matches.length === 1) return matches[0]!.face
  if (matches.length === 0) {
    if (part.componentName === "AssemblyMotor")
      throw new Error(
        `Motor "${part.name}" has no mounting face "${reference}"; use frontface or backface`,
      )
    throw new Error(`Part "${part.name}" has no reference face "${reference}"`)
  }
  throw new Error(
    `Part "${part.name}" mountFace "${reference}" matched ${matches.length} reference faces; expected exactly one`,
  )
}

export const resolveAssemblyMountTarget = (
  owner: PrimitiveComponent,
  reference: string,
  parts: AssemblyMountPart[],
) => {
  // Preserve compact identity paths without treating them as CSS tag names.
  const compact =
    /^[A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z_][A-Za-z0-9_-]*)+$/.test(reference)
  if (compact) {
    const separator = reference.lastIndexOf(".")
    const matches = parts.filter((part) =>
      matchesAssemblyIdentity(part, reference.slice(0, separator)),
    )
    if (matches.length > 1)
      throw new Error(
        `"${owner.name}" mountedTo "${reference}" matched ${matches.length} assembly parts; expected exactly one in the assembly device`,
      )
    if (matches.length === 1) {
      const part = matches[0]!
      return {
        part,
        face: resolveAssemblyMountFace(part, reference.slice(separator + 1)),
      }
    }
  }
  const matches = selectFaces(owner, reference, getAssemblyScope(owner), parts)
  if (compact && matches.length === 0)
    throw new Error(
      `"${owner.name}" mountedTo "${reference}" matched 0 assembly parts or reference faces; expected exactly one in the assembly device`,
    )
  if (matches.length !== 1)
    throw new Error(
      `"${owner.name}" mountedTo "${reference}" matched ${matches.length} reference faces; expected exactly one in the assembly device`,
    )
  return matches[0]!
}
