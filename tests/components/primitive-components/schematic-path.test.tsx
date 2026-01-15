import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicPath Test", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicpath
              points={[
                { x: 0, y: 0 },
                { x: 5, y: 0 },
                { x: 5, y: 5 },
                { x: 0, y: 5 },
              ]}
              isFilled={false}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicPath = circuitJson.filter((c) => c.type === "schematic_path")
  expect(schematicPath).toHaveLength(1)
  expect(schematicPath[0]).toMatchObject({
    type: "schematic_path",
    is_filled: false,
    points: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
      { x: 0, y: 5 },
    ],
  })

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("SchematicPath with fill", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicpath
              points={[
                { x: 0, y: 0 },
                { x: 2, y: 0 },
                { x: 1, y: 2 },
              ]}
              isFilled={true}
              fillColor="red"
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schematicPath = circuitJson.filter((c) => c.type === "schematic_path")
  expect(schematicPath).toHaveLength(1)
  expect(schematicPath[0]).toMatchObject({
    type: "schematic_path",
    is_filled: true,
    fill_color: "red",
  })
})
