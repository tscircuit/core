import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  RoundContact,
  getRoundContactDimensions,
} from "tests/fixtures/custom-symbol-sizing"

test.failing(
  "contain fitting keeps a round contact circular: width-only",
  () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={20} height={20} routingDisabled>
        <schematictext
          schX={-3}
          schY={-2}
          text="Legacy: stretched contact"
          fontSize={0.2}
        />
        <schematictext
          schX={3}
          schY={-2}
          text="Opt-in: round contact"
          fontSize={0.2}
        />
        <chip
          name="Legacy"
          schX={-3}
          symbol={<RoundContact width={2} height={1.2} />}
        />
        <chip
          name="Uniform"
          schX={3}
          symbol={<RoundContact fit="contain" width={2} />}
        />
      </board>,
    )
    circuit.render()
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
    const paths = circuit.db.schematic_path.list()
    const legacy = getRoundContactDimensions(paths[0]!.points)
    const uniform = getRoundContactDimensions(paths[1]!.points)
    // Defaults retain independent scaling and include the 0.1 mm port stub.
    expect(legacy.width).toBeCloseTo(2 / 1.1, 6)
    expect(legacy.height).toBeCloseTo(1.2, 6)
    expect(uniform.width).toBeCloseTo(1.8181818181818181, 6)
    expect(uniform.height).toBeCloseTo(uniform.width, 6)
  },
)
