import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

export default test("pinheader right side direction", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="J2"
        pinCount={3}
        facingDirection="right"
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2", "pin3"],
          },
        }}
      />
      <pinheader
        name="J3"
        pinCount={3}
        schX={5}
        facingDirection="right"
        schPinArrangement={{
          rightSide: {
            direction: "bottom-to-top",
            pins: ["pin1", "pin2", "pin3"],
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const ports = circuit.db.schematic_port.list()
  const comp1 = ports
    .filter((p) => p.schematic_component_id === "schematic_component_0")
    .sort((a, b) => b.center.y - a.center.y)
    .map((p) => p.pin_number)
  const comp2 = ports
    .filter((p) => p.schematic_component_id === "schematic_component_1")
    .sort((a, b) => b.center.y - a.center.y)
    .map((p) => p.pin_number)

  expect(comp1).toEqual([1, 2, 3])
  expect(comp2).toEqual([3, 2, 1])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
