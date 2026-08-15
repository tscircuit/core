import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicRect preserves fillColor in circuit json (#3068)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="SCHEMATIC_FILL_REPRO"
        pinLabels={{ pin1: ["A"], pin2: ["B"] }}
        footprint="dip2"
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
            <port
              name="pin1"
              pinNumber={1}
              direction="left"
              schX={-3}
              schY={0}
            />
            <port
              name="pin2"
              pinNumber={2}
              direction="right"
              schX={3}
              schY={0}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicRects = circuit.db.schematic_rect.list()
  expect(schematicRects.length).toBe(1)
  expect(schematicRects[0]?.is_filled).toBe(true)
  expect(schematicRects[0]?.fill_color).toBe("#FFFFFF")
})
