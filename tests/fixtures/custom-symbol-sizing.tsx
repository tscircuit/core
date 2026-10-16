export const RoundContact = (props: {
  width?: number
  height?: number
  fit?: "fill" | "contain"
  sizeIncludesPorts?: boolean
}) => (
  <symbol {...props}>
    {/* A path outline makes independent axis scaling visible as an ellipse. */}
    <schematicpath
      points={Array.from({ length: 65 }, (_, pointIndex) => {
        const angle = (pointIndex / 64) * 2 * Math.PI
        return { x: 0.5 * Math.cos(angle), y: 0.5 * Math.sin(angle) }
      })}
      strokeWidth={0.05}
    />
    <schematicline x1={-0.22} y1={0} x2={0.22} y2={0} strokeWidth={0.05} />
    <schematicline x1={0} y1={-0.22} x2={0} y2={0.22} strokeWidth={0.05} />
    <port name="pin1" pinNumber={1} direction="right" schX={0.5} schY={0} />
  </symbol>
)

export const getRoundContactDimensions = (
  points: { x: number; y: number }[],
) => ({
  width:
    Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x)),
  height:
    Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y)),
})
