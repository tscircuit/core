import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicrect preserves fillColor in circuit JSON and schematic SVG output", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect
              schX={0}
              schY={0}
              width={2}
              height={1}
              strokeWidth={0.12}
              color="#0f766e"
              isFilled={true}
              fillColor="#fef08a"
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const rects = circuit.db.schematic_rect.list()
  expect(rects).toHaveLength(1)
  expect(rects[0]?.color).toBe("#0f766e")
  expect(rects[0]?.is_filled).toBe(true)
  expect(rects[0]?.fill_color).toBe("#fef08a")

  const svg = convertCircuitJsonToSchematicSvg(circuit.getCircuitJson())
  expect(svg).toContain("#0f766e")
  expect(svg).toContain("#fef08a")
})
