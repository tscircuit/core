/**
 * pcbOffsetX/pcbOffsetY are aliases for pcbX/pcbY. Normalizing them onto
 * pcbX/pcbY right after props are parsed means every consumer of a parsed
 * pcb position (placement, edge anchors, calc references, manual placement
 * conflicts) only ever has to read pcbX/pcbY.
 */
export const applyPcbPositionPropAliases = <T>(parsedProps: T): T => {
  if (!parsedProps || typeof parsedProps !== "object") return parsedProps
  const props = parsedProps as Record<string, unknown>
  if (props.pcbX === undefined && props.pcbOffsetX !== undefined) {
    props.pcbX = props.pcbOffsetX
  }
  if (props.pcbY === undefined && props.pcbOffsetY !== undefined) {
    props.pcbY = props.pcbOffsetY
  }
  return parsedProps
}
