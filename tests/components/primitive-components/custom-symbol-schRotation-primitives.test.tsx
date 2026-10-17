import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schRotation turns every primitive of a custom symbol about the component", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        schX={5}
        schY={3}
        schRotation={90}
        symbol={
          <symbol>
            <schematicline x1={0} y1={0} x2={1} y2={0} strokeWidth={0.05} />
            <schematicrect
              schX={1}
              schY={0}
              width={0.4}
              height={0.2}
              strokeWidth={0.05}
            />
            <schematiccircle
              center={{ x: 0, y: 1 }}
              radius={0.25}
              strokeWidth={0.05}
            />
            <schematicarc
              center={{ x: -1, y: 0 }}
              radius={0.5}
              startAngleDegrees={0}
              endAngleDegrees={90}
              direction="counterclockwise"
              strokeWidth={0.05}
            />
            <schematictext schX={0} schY={-1} text="T" />
            <port name="1" direction="left" schX={-1} schY={0} />
          </symbol>
        }
      />
    </board>,
  )
  circuit.render()

  const [line] = circuit.db.schematic_line.list()
  expect(
    [line.x1, line.y1, line.x2, line.y2].map((v) => +v.toFixed(6)),
  ).toEqual([5, 3, 5, 4])

  const [rect] = circuit.db.schematic_rect.list()
  expect(rect.center.x).toBeCloseTo(5, 6)
  expect(rect.center.y).toBeCloseTo(4, 6)
  expect(rect.width).toBeCloseTo(0.2, 6)
  expect(rect.height).toBeCloseTo(0.4, 6)

  const [circle] = circuit.db.schematic_circle.list()
  expect(circle.center.x).toBeCloseTo(4, 6)
  expect(circle.center.y).toBeCloseTo(3, 6)
  expect(circle.radius).toBeCloseTo(0.25, 6)

  const [arc] = circuit.db.schematic_arc.list()
  expect(arc.center.x).toBeCloseTo(5, 6)
  expect(arc.center.y).toBeCloseTo(2, 6)
  expect(arc.radius).toBeCloseTo(0.5, 6)
  expect(arc.start_angle_degrees).toBeCloseTo(90, 6)
  expect(arc.end_angle_degrees).toBeCloseTo(180, 6)

  // Text moves with the symbol and stays upright, as built-in symbols' labels do
  const [text] = circuit.db.schematic_text.list()
  expect(text.position.x).toBeCloseTo(6, 6)
  expect(text.position.y).toBeCloseTo(3, 6)
  expect(text.rotation).toBe(0)

  const [component] = circuit.db.schematic_component.list()
  expect(component.size.width).toBeLessThan(component.size.height)
})
