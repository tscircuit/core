import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { grid } from "@tscircuit/math-utils"

test("pushbutton pin configurations with different net connections", () => {
  const { circuit } = getTestFixture()

  const combinations = [
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 3],
    [2, 4],
    [3, 4],
  ]

  circuit.add(
    <board width="20mm" height="15mm">
      {grid({ rows: 2, cols: 3, xSpacing: 3, ySpacing: 3 }).map(
        ({ center: { x, y }, index }) => (
          <pushbutton
            key={index}
            name={`PIN${combinations[index][0]}_PIN${combinations[index][1]}`}
            schX={x}
            schY={y}
            connections={{
              [`pin${combinations[index][0]}`]: `net.PIN${combinations[index][0]}`,
              [`pin${combinations[index][1]}`]: `net.PIN${combinations[index][1]}`,
            }}
            footprint="pushbutton_id1.3mm_od2mm"
          />
        ),
      )}
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
