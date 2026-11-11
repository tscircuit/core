/** Two terminals in footprint-local mm: +X right, +Y up, +Z above. */
export const differentialPairPathPads = (
  positivePin = "pin1",
  negativePin = "pin2",
) => (
  <footprint>
    <smtpad
      portHints={[positivePin]}
      pcbY={0.5}
      width={0.6}
      height={0.6}
      shape="rect"
    />
    <smtpad
      portHints={[negativePin]}
      pcbY={-0.5}
      width={0.6}
      height={0.6}
      shape="rect"
    />
  </footprint>
)
