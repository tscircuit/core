import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  SizingSquare,
  getSizingSquareDimensions,
} from "tests/fixtures/custom-symbol-sizing"

test.failing("contain fitting preserves square proportions: width-only", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20} routingDisabled>
      <schematictext
        schX={-3}
        schY={-2}
        text="Legacy: independent scaling"
        fontSize={0.2}
      />
      <schematictext
        schX={3}
        schY={-2}
        text="Opt-in: preserve proportions"
        fontSize={0.2}
      />
      <chip
        name="Legacy"
        schX={-3}
        symbol={<SizingSquare width={2} height={1.2} />}
      />
      <chip
        name="Uniform"
        schX={3}
        symbol={<SizingSquare fit="contain" width={2} />}
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
  expect(uniform.width).toBeCloseTo(1.8181818181818181, 6)
  expect(uniform.height).toBeCloseTo(uniform.width, 6)
})
