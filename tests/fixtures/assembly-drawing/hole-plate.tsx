import {
  Polygon,
  ExtrudeLinear,
  Rectangle,
  Subtract,
  Translate,
} from "jscad-fiber/model"

// Circular drill profiles use the planner's native polygon representation.
const circlePoints = (radius: number): [number, number][] =>
  Array.from({ length: 32 }, (_, index) => [
    radius * Math.cos((index * Math.PI) / 16),
    radius * Math.sin((index * Math.PI) / 16),
  ])

export function HolePlate() {
  return (
    <Subtract>
      <ExtrudeLinear height={4} topOutlineName="rim">
        <Rectangle size={[50, 30]} />
      </ExtrudeLinear>
      <Translate offset={[17, 8, 0]}>
        <ExtrudeLinear height={4} topOutlineName="H1">
          <Polygon points={circlePoints(1.5)} />
        </ExtrudeLinear>
      </Translate>
      <Translate offset={[-13, -6, 0]}>
        <ExtrudeLinear height={4} topOutlineName="H2">
          <Polygon points={circlePoints(2.5)} />
        </ExtrudeLinear>
      </Translate>
    </Subtract>
  )
}
