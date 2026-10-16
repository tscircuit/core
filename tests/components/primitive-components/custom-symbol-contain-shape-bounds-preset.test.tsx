import { expect, test } from "bun:test"
import type { SymbolComponent } from "lib/components/primitive-components/Symbol"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  RoundContact,
  getRoundContactDimensions,
} from "tests/fixtures/custom-symbol-sizing"

test.failing(
  "shape bounds preset measures artwork and explicit viewbox takes precedence",
  () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={20} height={20} routingDisabled>
        <schematictext
          schX={-3}
          schY={-2}
          text="shape_bounds: 2 mm body"
          fontSize={0.2}
        />
        <schematictext
          schX={3}
          schY={-2}
          text="Explicit viewbox: 1 mm body"
          fontSize={0.2}
        />
        <chip
          name="ShapeBounds"
          schX={-3}
          symbol={
            <RoundContact
              width={2}
              fit="contain"
              viewboxPreset="shape_bounds"
            />
          }
        />
        <chip
          name="Explicit"
          schX={3}
          symbol={
            <RoundContact
              width={2}
              fit="contain"
              viewboxPreset="shape_bounds"
              viewbox={{ minX: -1, maxX: 1, minY: -1, maxY: 1 }}
            />
          }
        />
      </board>,
    )
    circuit.render()
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
    const paths = circuit.db.schematic_path.list()
    expect(getRoundContactDimensions(paths[0]!.points).width).toBeCloseTo(2, 6)
    expect(getRoundContactDimensions(paths[0]!.points).height).toBeCloseTo(2, 6)
    expect(getRoundContactDimensions(paths[1]!.points).width).toBeCloseTo(1, 6)
    expect(getRoundContactDimensions(paths[1]!.points).height).toBeCloseTo(1, 6)
    const symbols = circuit.selectAll("symbol") as SymbolComponent[]
    expect(symbols[0]!.getSchematicSymbolBounds()).toEqual({
      minX: -0.5,
      maxX: 0.5,
      minY: -0.5,
      maxY: 0.5,
    })
    expect(symbols[1]!.getSchematicSymbolBounds()).toEqual({
      minX: -1,
      maxX: 1,
      minY: -1,
      maxY: 1,
    })
    expect(circuit.db.schematic_port.list()[0]!.center.x).toBeCloseTo(-2, 6)
    expect(circuit.db.schematic_port.list()[1]!.center.x).toBeCloseTo(3.5, 6)
  },
)
