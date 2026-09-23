import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematictext should replace {REFDES} with the component's reference designator", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <chip
      name="U1"
      symbol={
        <symbol>
          <schematictext schX={0} schY={1} text="{REFDES}" fontSize={0.2} />
          <schematictext schX={0} schY={0.6} text="{REF}" fontSize={0.2} />
          <schematictext schX={0} schY={0.2} text="{NAME}" fontSize={0.2} />
          <schematicline
            x1={-0.5}
            y1={-0.7}
            x2={0.7}
            y2={-0.7}
            strokeWidth={0.05}
          />
          <port
            name="IN"
            schX={-1}
            schY={0}
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

  const schematicTexts = circuit.db.schematic_text.list().map((t) => t.text)
  expect(schematicTexts).toContain("U1")
  expect(schematicTexts.filter((t) => t === "U1")).toHaveLength(3)
  expect(schematicTexts.some((t) => t.includes("{"))).toBe(false)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
