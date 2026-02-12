import type { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { extractCalcIdentifiers } from "lib/utils/evaluateCalcString"
import type { Group } from "./Group"

const SUPPORTED_COMPONENT_FIELDS = new Set([
  "x",
  "y",
  "minx",
  "maxx",
  "miny",
  "maxy",
  "width",
  "height",
])

type PlacementCandidate = {
  component: NormalComponent
  refs: Set<string>
}

export function Group_doInitialPcbCalcPlacementResolution(
  group: Group<any>,
): void {
  if (group.root?.pcbDisabled) return
  if (!group.isSubcircuit) return

  const { db } = group.root!
  const normalComponentNameMap =
    group.getNormalComponentNameMap?.() ?? new Map()

  const allNormalComponents = collectNormalComponentsInSubcircuit(group)
  const namedComponentVars: Record<string, number> = {}

  for (const component of allNormalComponents) {
    updateVarsForNamedComponent(component, namedComponentVars)
  }

  const candidatesByName = new Map<string, PlacementCandidate>()
  const inDegree = new Map<string, number>()
  const dependents = new Map<string, Set<string>>()

  for (const component of allNormalComponents) {
    const refs = getComponentRefsForCalcPlacement(component)
    if (refs.size === 0) continue
    if (!component.name) {
      throw new Error(
        `Invalid pcb position expression for ${component.getString()}: component-relative calc requires the component to have a name`,
      )
    }
    candidatesByName.set(component.name, { component, refs })
    inDegree.set(component.name, 0)
  }

  for (const [candidateName, candidate] of candidatesByName.entries()) {
    for (const token of candidate.refs) {
      const { componentName, field } = parseComponentReferenceToken(token)
      if (!SUPPORTED_COMPONENT_FIELDS.has(field)) {
        throw new Error(
          `Invalid pcb position expression for ${candidate.component.getString()}: unsupported component field "${field}" in "${token}"`,
        )
      }

      const referencedComponents = normalComponentNameMap.get(componentName)
      if (!referencedComponents || referencedComponents.length === 0) {
        throw new Error(
          `Invalid pcb position expression for ${candidate.component.getString()}: unknown component reference "${componentName}" in "${token}"`,
        )
      }

      if (referencedComponents.length > 1) {
        throw new Error(
          `Invalid pcb position expression for ${candidate.component.getString()}: ambiguous component reference "${componentName}" in "${token}"`,
        )
      }

      if (
        candidatesByName.has(componentName) &&
        componentName !== candidateName
      ) {
        inDegree.set(candidateName, (inDegree.get(candidateName) ?? 0) + 1)
        if (!dependents.has(componentName)) {
          dependents.set(componentName, new Set())
        }
        dependents.get(componentName)!.add(candidateName)
      }
    }
  }

  const queue = [...inDegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([name]) => name)

  let resolvedCount = 0

  while (queue.length > 0) {
    const name = queue.shift()!
    const candidate = candidatesByName.get(name)
    if (!candidate) continue

    resolveCandidatePlacement(candidate.component, namedComponentVars)
    resolvedCount++

    for (const dependentName of dependents.get(name) ?? []) {
      const nextDegree = (inDegree.get(dependentName) ?? 0) - 1
      inDegree.set(dependentName, nextDegree)
      if (nextDegree === 0) queue.push(dependentName)
    }
  }

  if (resolvedCount < candidatesByName.size) {
    const unresolvedNames = [...candidatesByName.keys()].filter(
      (name) => (inDegree.get(name) ?? 0) > 0,
    )
    throw new Error(
      `Circular pcb position calc references detected among: ${unresolvedNames.join(", ")}`,
    )
  }

  function resolveCandidatePlacement(
    component: NormalComponent,
    componentVars: Record<string, number>,
  ): void {
    if (!component.pcb_component_id) return

    const pcbComponent = db.pcb_component.get(component.pcb_component_id)
    if (!pcbComponent) return

    const rawPcbX = (component._parsedProps as any).pcbX
    const rawPcbY = (component._parsedProps as any).pcbY

    const nextCenter = {
      x: pcbComponent.center.x,
      y: pcbComponent.center.y,
    }

    if (rawPcbX !== undefined) {
      const resolvedPcbX = component.resolvePcbCoordinate(rawPcbX, "pcbX", {
        allowComponentVariables: true,
        componentVariables: componentVars,
      })
      component._resolvedPcbCalcOffsetX = resolvedPcbX
      nextCenter.x = resolvedPcbX
    }

    if (rawPcbY !== undefined) {
      const resolvedPcbY = component.resolvePcbCoordinate(rawPcbY, "pcbY", {
        allowComponentVariables: true,
        componentVariables: componentVars,
      })
      component._resolvedPcbCalcOffsetY = resolvedPcbY
      nextCenter.y = resolvedPcbY
    }

    component._repositionOnPcb(nextCenter)
    updateVarsForNamedComponent(component, componentVars)
  }
}

function collectNormalComponentsInSubcircuit(
  group: Group<any>,
): NormalComponent[] {
  const components: NormalComponent[] = []

  const walk = (node: PrimitiveComponent): void => {
    if ((node as NormalComponent)._isNormalComponent) {
      components.push(node as NormalComponent)
    }
    for (const child of node.children) {
      if (!child.isSubcircuit) walk(child)
    }
  }

  for (const child of group.children) {
    if (!child.isSubcircuit) walk(child)
  }

  return components
}

function getComponentRefsForCalcPlacement(
  component: NormalComponent,
): Set<string> {
  const refs = new Set<string>()
  const rawPcbX = (component._parsedProps as any).pcbX
  const rawPcbY = (component._parsedProps as any).pcbY

  const addRefs = (rawValue: unknown) => {
    if (typeof rawValue !== "string") return
    const identifiers = extractCalcIdentifiers(rawValue)
    for (const identifier of identifiers) {
      if (!identifier.startsWith("board.")) {
        refs.add(identifier)
      }
    }
  }

  addRefs(rawPcbX)
  addRefs(rawPcbY)
  return refs
}

function parseComponentReferenceToken(token: string): {
  componentName: string
  field: string
} {
  const dotIndex = token.lastIndexOf(".")
  if (dotIndex <= 0 || dotIndex === token.length - 1) {
    throw new Error(`Invalid component reference token: "${token}"`)
  }
  return {
    componentName: token.slice(0, dotIndex),
    field: token.slice(dotIndex + 1).toLowerCase(),
  }
}

function updateVarsForNamedComponent(
  component: NormalComponent,
  vars: Record<string, number>,
): void {
  if (!component.name || !component.pcb_component_id || !component.root) return

  const pcbComponent = component.root.db.pcb_component.get(
    component.pcb_component_id,
  )
  if (!pcbComponent) return

  const width = pcbComponent.width ?? 0
  const height = pcbComponent.height ?? 0
  const x = pcbComponent.center.x
  const y = pcbComponent.center.y

  vars[`${component.name}.x`] = x
  vars[`${component.name}.y`] = y
  vars[`${component.name}.width`] = width
  vars[`${component.name}.height`] = height
  vars[`${component.name}.minx`] = x - width / 2
  vars[`${component.name}.maxx`] = x + width / 2
  vars[`${component.name}.miny`] = y - height / 2
  vars[`${component.name}.maxy`] = y + height / 2
}
