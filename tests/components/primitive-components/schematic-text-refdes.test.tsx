import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematictext should replace {NAME} with the component's reference designator", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <chip
      name="U1"
      symbol={
        <symbol>
          <schematictext schX={0} schY={1} text="{NAME}" fontSize={0.2} />
          <schematicline
            x1={-0.5}
            y1={-0.7}
            x2={-0.5}
            y2={0.7}
            strokeWidth={0.05}
          />

          <schematicline
            x1={-0.5}
            y1={0.7}
            x2={0.7}
            y2={0}
            strokeWidth={0.05}
          />

          <schematicline
            x1={0.7}
            y1={0}
            x2={-0.5}
            y2={-0.7}
            strokeWidth={0.05}
          />

          <schematictext schX={-0.35} schY={0.35} text="+" fontSize={0.3} />

          <schematictext schX={-0.35} schY={-0.35} text="-" fontSize={0.3} />

          <port
            name="IN+"
            schX={-1}
            schY={0.35}
            direction="left"
            schStemLength={0.5}
          />

          <port
            name="IN-"
            schX={-1}
            schY={-0.35}
            direction="left"
            schStemLength={0.5}
          />

          <port
            name="OUT"
            schX={1.2}
            schY={0}
            direction="right"
            schStemLength={0.5}
          />
        </symbol>
      }
    />,
  )

  circuit.render()

  const schematicTexts = circuit.db.schematic_text.list()
  expect(schematicTexts.some((t) => t.text === "U1")).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
