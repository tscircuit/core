/** Board-wide restrictions also apply when a bus or a fanout stage narrows its layers. */
export function getAllowedRoutingLayers(
  boardLayers: string[] | undefined,
  requestedLayers: string[] | undefined,
): string[] | undefined {
  if (!boardLayers) return requestedLayers
  if (!requestedLayers) return boardLayers
  const allowedLayers = requestedLayers.filter((layer) =>
    boardLayers.includes(layer),
  )
  if (!allowedLayers.length) {
    throw new Error(
      `Requested routing layers (${requestedLayers.join(", ")}) have no layer in common with the board (${boardLayers.join(", ")})`,
    )
  }
  return allowedLayers
}
