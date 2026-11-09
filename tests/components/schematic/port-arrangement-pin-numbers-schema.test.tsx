import { expect, test } from "bun:test"
import { schematic_component } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// schPortArrangement accepts pin labels, but circuit-json stores side pins as
// pin numbers.
test("schematic port_arrangement sides store pin numbers", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic4"
        pinLabels={{ pin1: "SDA", pin2: "SCL", pin3: "GND", pin4: "VCC" }}
        schPortArrangement={{
          leftSide: { direction: "top-to-bottom", pins: ["pin1", "SCL"] },
          rightSide: { direction: "top-to-bottom", pins: [4, "GND"] },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const component = circuit.db.schematic_component.list()[0]
  expect(component.port_arrangement).toMatchObject({
    left_side: { direction: "top-to-bottom", pins: [1, 2] },
    right_side: { direction: "top-to-bottom", pins: [4, 3] },
  })
  expect(schematic_component.safeParse(component).error?.issues).toBeUndefined()
})
