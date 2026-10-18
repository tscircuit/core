import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  RoundContact,
  getRoundContactDimensions,
} from "tests/fixtures/custom-symbol-sizing"

test("symbol viewbox uses local coordinates at a translated position", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20} routingDisabled>
      <schematictext
        schX={3}
        schY={2}
        text="Local viewbox: contact at (3, 4), pin at (4, 4)"
        fontSize={0.2}
      />
      <chip
        name="Contact"
        schX={3}
        schY={4}
        symbol={
          <RoundContact
            sourceCenter={{ x: 1, y: 2 }}
            fit="contain"
            width={2}
            viewbox={{ minX: 0.5, maxX: 1.5, minY: 1.5, maxY: 2.5 }}
          />
        }
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  const points = circuit.db.schematic_path.list()[0]!.points
  const dimensions = getRoundContactDimensions(points)
  expect(dimensions.width).toBeCloseTo(2, 6)
  expect(dimensions.height).toBeCloseTo(2, 6)
  expect(
    (Math.min(...points.map((p) => p.x)) +
      Math.max(...points.map((p) => p.x))) /
      2,
  ).toBeCloseTo(3, 6)
  expect(
    (Math.min(...points.map((p) => p.y)) +
      Math.max(...points.map((p) => p.y))) /
      2,
  ).toBeCloseTo(4, 6)
  const port = circuit.db.schematic_port.list()[0]!
  expect(port.center.x).toBeCloseTo(4, 6)
  expect(port.center.y).toBeCloseTo(4, 6)
})
