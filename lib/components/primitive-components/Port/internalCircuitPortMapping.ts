import type { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Port } from "./Port"

const getInternalCircuitAncestor = (port: Port): PrimitiveComponent | null => {
  let ancestor = port.parent
  while (ancestor) {
    if (ancestor.componentName === "InternalCircuit") return ancestor
    ancestor = ancestor.parent
  }
  return null
}

export const isInternalCircuitPort = (port: Port): boolean =>
  getInternalCircuitAncestor(port) !== null

const getConnectionTargets = (
  target: string | string[] | readonly string[] | undefined,
): string[] => {
  if (!target) return []
  return typeof target === "string" ? [target] : [...target]
}

const getChipPortsMappedToInternalCircuitPort = (
  internalCircuitPort: Port,
): Port[] => {
  const internalCircuit = getInternalCircuitAncestor(internalCircuitPort)
  const containingChip = internalCircuit?.parent
  if (!internalCircuit || !containingChip) return []

  const internalComponent = internalCircuitPort.getParentNormalComponent()
  const connections = internalComponent?._parsedProps?.connections as
    | Record<string, string | string[] | readonly string[] | undefined>
    | undefined
  if (!connections) return []

  const mappedChipPorts: Port[] = []
  for (const [portName, target] of Object.entries(connections)) {
    if (!internalCircuitPort.isMatchingAnyOf([portName])) continue

    for (const targetSelector of getConnectionTargets(target)) {
      const targetPort = internalCircuitPort
        .getSubcircuit()
        .selectOne<Port>(targetSelector, { type: "port" })
      if (!targetPort) continue
      if (targetPort.getParentNormalComponent() !== containingChip) continue
      if (!mappedChipPorts.includes(targetPort)) {
        mappedChipPorts.push(targetPort)
      }
    }
  }

  return mappedChipPorts
}

export const isInternalCircuitPortMappedToChipPort = (port: Port): boolean =>
  getChipPortsMappedToInternalCircuitPort(port).length > 0

export const getInternalCircuitPortMappedToChipPort = (
  chipPort: Port,
): Port | null => {
  const chipComponent =
    chipPort.getParentNormalComponent() as PrimitiveComponent | null
  if (!chipComponent) return null

  const internalCircuit = chipComponent.children.find(
    (child) => child.componentName === "InternalCircuit",
  )
  if (!internalCircuit) return null

  const mappedInternalCircuitPorts = internalCircuit
    .getDescendants()
    .filter((component) => component.componentName === "Port")
    .map((component) => component as Port)
    .filter((internalCircuitPort) =>
      getChipPortsMappedToInternalCircuitPort(internalCircuitPort).includes(
        chipPort,
      ),
    )

  if (mappedInternalCircuitPorts.length > 1) {
    throw new Error(
      `${chipPort.getString()} is mapped to multiple internal circuit ports: ${mappedInternalCircuitPorts
        .map((port) => port.getString())
        .join(", ")}. A chip port can overlap only one internal circuit port.`,
    )
  }

  return mappedInternalCircuitPorts[0] ?? null
}
