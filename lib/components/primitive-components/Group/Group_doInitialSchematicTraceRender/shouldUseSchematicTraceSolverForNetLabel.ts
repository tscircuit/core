import type { NetLabel } from "../../NetLabel"

export const shouldUseSchematicTraceSolverForNetLabel = (
  netLabel: NetLabel,
): boolean => {
  const { schX, schY } = netLabel._parsedProps
  return schX === undefined && schY === undefined
}
