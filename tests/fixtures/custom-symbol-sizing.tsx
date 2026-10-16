import type { SchematicSymbolBounds } from "lib/components/primitive-components/Symbol/ISymbol"

export const RoundContact = ({
  sourceCenter = { x: 0, y: 0 },
  ...props
}: {
  width?: number
  height?: number
  fit?: "fill" | "contain" | "stretch"
  viewbox?: SchematicSymbolBounds
  viewboxPreset?: "shape_bounds"
  sourceCenter?: { x: number; y: number }
}) => (
  <symbol {...props}>
    {/* A path outline makes independent axis scaling visible as an ellipse. */}
    <schematicpath
      points={Array.from({ length: 65 }, (_, pointIndex) => {
        const angle = (pointIndex / 64) * 2 * Math.PI
        return {
          x: sourceCenter.x + 0.5 * Math.cos(angle),
          y: sourceCenter.y + 0.5 * Math.sin(angle),
        }
      })}
      strokeWidth={0.05}
    />
    <schematicline
      x1={sourceCenter.x - 0.22}
      y1={sourceCenter.y}
      x2={sourceCenter.x + 0.22}
      y2={sourceCenter.y}
      strokeWidth={0.05}
    />
    <schematicline
      x1={sourceCenter.x}
      y1={sourceCenter.y - 0.22}
      x2={sourceCenter.x}
      y2={sourceCenter.y + 0.22}
      strokeWidth={0.05}
    />
    <port
      name="pin1"
      pinNumber={1}
      direction="right"
      schX={sourceCenter.x + 0.5}
      schY={sourceCenter.y}
    />
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
