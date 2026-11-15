import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicRect propagates fillColor to circuit JSON (#3068)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect
              schX={0}
              schY={1.5}
              width={4}
              height={2}
              color="#880000"
              isFilled
              fillColor="#FFFFFF"
            />
            <schematicrect
              schX={0}
              schY={-1.5}
              width={4}
              height={2}
              color="#008800"
              isFilled={false}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const rects = circuit
    .getCircuitJson()
    .filter((c) => c.type === "schematic_rect")
  expect(rects).toHaveLength(2)

  const filledRect = rects.find((r: any) => r.is_filled) as any
  expect(filledRect).toBeDefined()
  expect(filledRect.color).toBe("#880000")
  expect(filledRect.is_filled).toBe(true)
  expect(filledRect.fill_color).toBe("#FFFFFF")

  const unfilledRect = rects.find((r: any) => !r.is_filled) as any
  expect(unfilledRect).toBeDefined()
  expect(unfilledRect.color).toBe("#008800")
  expect(unfilledRect.is_filled).toBe(false)
  expect(unfilledRect.fill_color).toBeUndefined()
})
