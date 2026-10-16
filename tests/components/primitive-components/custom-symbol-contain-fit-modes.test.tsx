import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  RoundContact,
  getRoundContactDimensions,
} from "tests/fixtures/custom-symbol-sizing"

test.failing(
  "fill and stretch scale independently while contain preserves proportions",
  () => {
    const { circuit } = getTestFixture()
    const fits = ["fill", "stretch", "contain"] as const
    circuit.add(
      <board width={20} height={20} routingDisabled>
        {fits.map((fit, fitIndex) => (
          <schematictext
            schX={(fitIndex - 1) * 4}
            schY={-2}
            text={
              fit === "contain"
                ? "contain: circular"
                : `${fit}: independent axes`
            }
            fontSize={0.2}
          />
        ))}
        {fits.map((fit, fitIndex) => (
          <chip
            name={fit}
            schX={(fitIndex - 1) * 4}
            symbol={
              <RoundContact
                fit={fit}
                width={2}
                height={1.2}
                viewbox={{ minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 }}
              />
            }
          />
        ))}
      </board>,
    )
    circuit.render()
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
    const paths = circuit.db.schematic_path.list()
    for (const [fitIndex, fit] of fits.entries()) {
      const dimensions = getRoundContactDimensions(paths[fitIndex]!.points)
      expect(dimensions.width).toBeCloseTo(fit === "contain" ? 1.2 : 2, 6)
      expect(dimensions.height).toBeCloseTo(1.2, 6)
    }
  },
)
