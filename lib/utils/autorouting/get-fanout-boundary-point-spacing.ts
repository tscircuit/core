export const getFanoutBoundaryPointSpacing = ({
  traceWidth,
  traceToPadClearance,
  viaPadDiameter,
}: {
  traceWidth: number
  traceToPadClearance: number
  viaPadDiameter?: number
}): number =>
  (viaPadDiameter ?? Math.max(traceWidth * 2, 0.3)) +
  2 * (traceWidth + traceToPadClearance)
