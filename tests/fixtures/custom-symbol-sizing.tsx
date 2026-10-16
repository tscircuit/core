export const SizingSquare = (props: {
  width?: number
  height?: number
  fit?: "fill" | "contain"
  sizeIncludesPorts?: boolean
}) => (
  <symbol {...props}>
    <schematicpath
      points={[
        { x: -0.5, y: -0.5 },
        { x: 0.5, y: -0.5 },
        { x: 0.5, y: 0.5 },
        { x: -0.5, y: 0.5 },
        { x: -0.5, y: -0.5 },
      ]}
      strokeWidth={0.05}
    />
    <port name="pin1" pinNumber={1} direction="right" schX={0.5} schY={0} />
  </symbol>
)

export const getSizingSquareDimensions = (
  points: { x: number; y: number }[],
) => ({
  width:
    Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x)),
  height:
    Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y)),
})
