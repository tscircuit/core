import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  SizingSquare,
  getSizingSquareDimensions,
} from "tests/fixtures/custom-symbol-sizing"

test("contain fitting preserves square proportions: box", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20} routingDisabled>
      <chip
        name="Legacy"
        schX={-3}
        symbol={<SizingSquare width={2} height={1.2} />}
      />
      <chip
        name="Uniform"
        schX={3}
        symbol={<SizingSquare fit="contain" width={2} height={1.2} />}
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  const paths = circuit.db.schematic_path.list()
  const legacy = getSizingSquareDimensions(paths[0]!.points)
  const uniform = getSizingSquareDimensions(paths[1]!.points)
  // Defaults retain independent scaling and include the 0.1 mm port stub.
  expect(legacy.width).toBeCloseTo(2 / 1.1, 6)
  expect(legacy.height).toBeCloseTo(1.2, 6)
  expect(uniform.width).toBeCloseTo(1.2, 6)
  expect(uniform.height).toBeCloseTo(uniform.width, 6)
})
