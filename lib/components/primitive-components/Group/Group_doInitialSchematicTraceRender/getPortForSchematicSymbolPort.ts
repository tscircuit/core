import type { Port } from "../../Port"

/**
 * Return the physical port that supplies this port's schematic symbol port.
 * A footprint can have more physical pins than its schematic symbol.
 */
export const getPortForSchematicSymbolPort = (port: Port): Port => {
  const { schX, schY } = port._parsedProps
  if (schX !== undefined && schY !== undefined) return port
  const parentNormalComponent = port.getParentNormalComponent()
  if (parentNormalComponent?._hasCustomSymbolPorts?.()) {
    if (port._getSymbolAncestor()) return port
    return port._getCustomSymbolInternallyConnectedPort() ?? port
  }
  if (!parentNormalComponent?.getSchematicSymbol()) return port

  const internallyConnectedPorts = port._getPortsInternallyConnectedToThisPort()
  const schematicSymbolPortDef =
    port.schematicSymbolPortDef ??
    internallyConnectedPorts.find(
      (connectedPort) => connectedPort.schematicSymbolPortDef,
    )?.schematicSymbolPortDef

  if (!schematicSymbolPortDef) return port

  return (
    internallyConnectedPorts.find(
      (connectedPort) =>
        connectedPort.schematicSymbolPortDef === schematicSymbolPortDef,
    ) ?? port
  )
}
