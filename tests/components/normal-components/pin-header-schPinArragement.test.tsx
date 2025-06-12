import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a pinheader with pinrow4 footprint right side", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P1"
        pinCount={5}
        footprint="pinrow4"
        schRotation={90}
        schX={-3}
        facingDirection="right"
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2", "pin3", "pin4", "pin5"],
          },
        }}
      />
      <pinheader
        name="P2"
        pinCount={5}
        footprint="pinrow4"
        schRotation={90}
        schX={0}
        facingDirection="left"
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2", "pin3", "pin4", "pin5"],
          },
        }}
      />
      <pinheader
        name="P3"
        pinCount={5}
        footprint="pinrow4"
        schRotation={90}
        schX={3}
        facingDirection="right"
        schPinArrangement={{
          rightSide: {
            direction: "bottom-to-top",
            pins: ["pin1", "pin2", "pin3", "pin4", "pin5"],
          },
        }}
      />
      <pinheader
        name="P4"
        pinCount={5}
        footprint="pinrow4"
        schRotation={90}
        schX={5}
        facingDirection="left"
        schPinArrangement={{
          leftSide: {
            direction: "bottom-to-top",
            pins: ["pin1", "pin2", "pin3", "pin4", "pin5"],
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schComponent = circuit.db.schematic_component.get(
    circuit.db.schematic_component.list()[0].schematic_component_id,
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
