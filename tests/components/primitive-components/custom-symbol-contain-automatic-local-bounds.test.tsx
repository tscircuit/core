import { expect, test } from "bun:test"
import type { SymbolComponent } from "lib/components/primitive-components/Symbol"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  RoundContact,
  getRoundContactDimensions,
} from "tests/fixtures/custom-symbol-sizing"

test.failing(
  "automatic source bounds stay in the local symbol coordinate space",
  () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={20} height={20} routingDisabled>
        <schematictext
          schX={3}
          schY={2}
          text="Automatic bounds stay local at chip (3, 4)"
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
            />
          }
        />
      </board>,
    )
    circuit.render()
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
    const symbol = circuit.selectAll("symbol")[0] as SymbolComponent
    const bounds = symbol.getSchematicSymbolBounds()!
    expect(bounds.minX).toBeCloseTo(0.5, 6)
    expect(bounds.maxX).toBeCloseTo(1.6, 6)
    expect(bounds.minY).toBeCloseTo(1.5, 6)
    expect(bounds.maxY).toBeCloseTo(2.5, 6)
    const dimensions = getRoundContactDimensions(
      circuit.db.schematic_path.list()[0]!.points,
    )
    expect(dimensions.width).toBeCloseTo(2 / 1.1, 6)
    expect(dimensions.height).toBeCloseTo(dimensions.width, 6)
  },
)
