import { getBoundsOfPcbElements } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
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
    if (!shouldResolvePlacementInCalcPhase(component)) continue
    const refs = getComponentRefsForCalcPlacement(component)
    if (!component.name) {
      throw new Error(
        `Invalid pcb position expression for ${component.getString()}: component-relative calc requires the component to have a name`,
      )
    }
    candidatesByName.set(component.name, { component, refs })
    inDegree.set(component.name, 0)
  }

  for (const [candidateName, candidate] of candidatesByName.entries()) {
    const referencedCandidateNames = new Set<string>()

    for (const token of candidate.refs) {
      const { referencePath, field } = parseComponentReferenceToken(token)
      if (!SUPPORTED_COMPONENT_FIELDS.has(field)) {
        throw new Error(
          `Invalid pcb position expression for ${candidate.component.getString()}: unsupported component field "${field}" in "${token}"`,
        )
      }

      const referencedComponentName = resolveReferencedComponentName({
        token,
        referencePath,
        candidate,
        normalComponentNameMap,
      })

      if (
        candidatesByName.has(referencedComponentName) &&
        referencedComponentName !== candidateName
      ) {
        referencedCandidateNames.add(referencedComponentName)
      }
    }

    for (const referencedComponentName of referencedCandidateNames) {
      inDegree.set(candidateName, (inDegree.get(candidateName) ?? 0) + 1)
      if (!dependents.has(referencedComponentName)) {
        dependents.set(referencedComponentName, new Set())
      }
      dependents.get(referencedComponentName)!.add(candidateName)
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
    const rawComponentProps = component.props as any
    const rawPcbLeftEdgeX =
      (component._parsedProps as any).pcbLeftEdgeX ??
      rawComponentProps.pcbLeftEdgeX
    const rawPcbRightEdgeX =
      (component._parsedProps as any).pcbRightEdgeX ??
      rawComponentProps.pcbRightEdgeX
    const rawPcbTopEdgeY =
      (component._parsedProps as any).pcbTopEdgeY ??
      rawComponentProps.pcbTopEdgeY
    const rawPcbBottomEdgeY =
      (component._parsedProps as any).pcbBottomEdgeY ??
      rawComponentProps.pcbBottomEdgeY

    if (rawPcbLeftEdgeX !== undefined && rawPcbRightEdgeX !== undefined) {
      throw new Error(
        `${component.componentName} cannot set both pcbLeftEdgeX and pcbRightEdgeX`,
      )
    }

    if (rawPcbTopEdgeY !== undefined && rawPcbBottomEdgeY !== undefined) {
      throw new Error(
        `${component.componentName} cannot set both pcbTopEdgeY and pcbBottomEdgeY`,
      )
    }

    const componentWidth = pcbComponent.width ?? 0
    const componentHeight = pcbComponent.height ?? 0

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
    } else if (rawPcbLeftEdgeX !== undefined) {
      const resolvedPcbLeftEdgeX = component.resolvePcbCoordinate(
        rawPcbLeftEdgeX,
        "pcbX",
        {
          allowComponentVariables: true,
          componentVariables: componentVars,
        },
      )
      const resolvedPcbX = resolvedPcbLeftEdgeX + componentWidth / 2
      component._resolvedPcbCalcOffsetX = resolvedPcbX
      nextCenter.x = resolvedPcbX
    } else if (rawPcbRightEdgeX !== undefined) {
      const resolvedPcbRightEdgeX = component.resolvePcbCoordinate(
        rawPcbRightEdgeX,
        "pcbX",
        {
          allowComponentVariables: true,
          componentVariables: componentVars,
        },
      )
      const resolvedPcbX = resolvedPcbRightEdgeX - componentWidth / 2
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
    } else if (rawPcbTopEdgeY !== undefined) {
      const resolvedPcbTopEdgeY = component.resolvePcbCoordinate(
        rawPcbTopEdgeY,
        "pcbY",
        {
          allowComponentVariables: true,
          componentVariables: componentVars,
        },
      )
      const resolvedPcbY = resolvedPcbTopEdgeY - componentHeight / 2
      component._resolvedPcbCalcOffsetY = resolvedPcbY
      nextCenter.y = resolvedPcbY
    } else if (rawPcbBottomEdgeY !== undefined) {
      const resolvedPcbBottomEdgeY = component.resolvePcbCoordinate(
        rawPcbBottomEdgeY,
        "pcbY",
        {
          allowComponentVariables: true,
          componentVariables: componentVars,
        },
      )
      const resolvedPcbY = resolvedPcbBottomEdgeY + componentHeight / 2
      component._resolvedPcbCalcOffsetY = resolvedPcbY
      nextCenter.y = resolvedPcbY
    }

    component._repositionOnPcb(nextCenter)
    updateVarsForNamedComponent(component, componentVars)
  }
}

function shouldResolvePlacementInCalcPhase(
  component: NormalComponent,
): boolean {
  const parsedProps = component._parsedProps as any
  const rawProps = component.props as any

  const pcbX = parsedProps.pcbX
  const pcbY = parsedProps.pcbY
  const pcbLeftEdgeX = parsedProps.pcbLeftEdgeX ?? rawProps.pcbLeftEdgeX
  const pcbRightEdgeX = parsedProps.pcbRightEdgeX ?? rawProps.pcbRightEdgeX
  const pcbTopEdgeY = parsedProps.pcbTopEdgeY ?? rawProps.pcbTopEdgeY
  const pcbBottomEdgeY = parsedProps.pcbBottomEdgeY ?? rawProps.pcbBottomEdgeY

  if (
    pcbLeftEdgeX !== undefined ||
    pcbRightEdgeX !== undefined ||
    pcbTopEdgeY !== undefined ||
    pcbBottomEdgeY !== undefined
  ) {
    return true
  }

  return typeof pcbX === "string" || typeof pcbY === "string"
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
  const rawComponentProps = component.props as any
  const rawPcbLeftEdgeX =
    (component._parsedProps as any).pcbLeftEdgeX ??
    rawComponentProps.pcbLeftEdgeX
  const rawPcbRightEdgeX =
    (component._parsedProps as any).pcbRightEdgeX ??
    rawComponentProps.pcbRightEdgeX
  const rawPcbTopEdgeY =
    (component._parsedProps as any).pcbTopEdgeY ?? rawComponentProps.pcbTopEdgeY
  const rawPcbBottomEdgeY =
    (component._parsedProps as any).pcbBottomEdgeY ??
    rawComponentProps.pcbBottomEdgeY

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
  addRefs(rawPcbLeftEdgeX)
  addRefs(rawPcbRightEdgeX)
  addRefs(rawPcbTopEdgeY)
  addRefs(rawPcbBottomEdgeY)
  return refs
}

function parseComponentReferenceToken(token: string): {
  referencePath: string
  field: string
} {
  const dotIndex = token.lastIndexOf(".")
  if (dotIndex <= 0 || dotIndex === token.length - 1) {
    throw new Error(`Invalid component reference token: "${token}"`)
  }
  return {
    referencePath: token.slice(0, dotIndex),
    field: token.slice(dotIndex + 1).toLowerCase(),
  }
}

function resolveReferencedComponentName(params: {
  token: string
  referencePath: string
  candidate: PlacementCandidate
  normalComponentNameMap: Map<string, NormalComponent[]>
}): string {
  const { token, referencePath, candidate, normalComponentNameMap } = params

  const directComponents = normalComponentNameMap.get(referencePath)
  if (directComponents && directComponents.length > 0) {
    if (directComponents.length > 1) {
      throw new Error(
        `Invalid pcb position expression for ${candidate.component.getString()}: ambiguous component reference "${referencePath}" in "${token}"`,
      )
    }
    return referencePath
  }

  let bestMatch: string | null = null
  for (const componentName of normalComponentNameMap.keys()) {
    if (!referencePath.startsWith(`${componentName}.`)) continue
    if (!bestMatch || componentName.length > bestMatch.length) {
      bestMatch = componentName
    }
  }

  if (!bestMatch) {
    throw new Error(
      `Invalid pcb position expression for ${candidate.component.getString()}: unknown component reference "${referencePath}" in "${token}"`,
    )
  }

  return bestMatch
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

  const padElementsByReference = collectPadElementsByReference(component)
  for (const [referencePath, elements] of padElementsByReference.entries()) {
    const bounds = getBoundsOfPcbElements(elements)
    const minX = bounds.minX
    const maxX = bounds.maxX
    const minY = bounds.minY
    const maxY = bounds.maxY

    vars[`${referencePath}.x`] = (minX + maxX) / 2
    vars[`${referencePath}.y`] = (minY + maxY) / 2
    vars[`${referencePath}.width`] = maxX - minX
    vars[`${referencePath}.height`] = maxY - minY
    vars[`${referencePath}.minx`] = minX
    vars[`${referencePath}.maxx`] = maxX
    vars[`${referencePath}.miny`] = minY
    vars[`${referencePath}.maxy`] = maxY
  }
}

function collectPadElementsByReference(
  component: NormalComponent,
): Map<string, AnyCircuitElement[]> {
  const refsToElements = new Map<string, AnyCircuitElement[]>()
  if (!component.name || !component.pcb_component_id || !component.root) {
    return refsToElements
  }

  const { db } = component.root
  const padElements = [
    ...db.pcb_smtpad.list({ pcb_component_id: component.pcb_component_id }),
    ...db.pcb_plated_hole.list({
      pcb_component_id: component.pcb_component_id,
    }),
  ] as AnyCircuitElement[]

  for (const pad of padElements) {
    const aliases = new Set<string>()

    for (const hint of (pad as any).port_hints ?? []) {
      if (typeof hint === "string" && hint.length > 0) aliases.add(hint)
    }

    const pcbPortId = (pad as any).pcb_port_id
    if (pcbPortId) {
      const pcbPort = db.pcb_port.get(pcbPortId)
      const sourcePort = pcbPort?.source_port_id
        ? db.source_port.get(pcbPort.source_port_id)
        : null

      if (sourcePort?.name) aliases.add(sourcePort.name)
      if (sourcePort?.pin_number != null) {
        aliases.add(`pin${sourcePort.pin_number}`)
      }
    }

    for (const alias of aliases) {
      const referencePath = `${component.name}.${alias}`
      if (!refsToElements.has(referencePath)) {
        refsToElements.set(referencePath, [])
      }
      refsToElements.get(referencePath)!.push(pad)
    }
  }

  return refsToElements
}
