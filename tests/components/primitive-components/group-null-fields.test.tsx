import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { schematic_group } from "circuit-json"

test("group does not emit null anchor_alignment or subcircuit_id", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <group name="G1" pcbX={4}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcbGroup = circuitJson.find((e: any) => e.type === "pcb_group") as any
  const schematicGroups = circuitJson.filter(
    (e: any) => e.type === "schematic_group",
  ) as any[]

  // pcb_group.anchor_alignment has a schema default of "center" — writing
  // explicit null failed validation; undefined lets the default apply.
  expect(pcbGroup.anchor_alignment).toBeUndefined()

  // schematic_group.subcircuit_id is optional — a group outside any
  // subcircuit legitimately has none; it must be absent, not null.
  for (const sg of schematicGroups) {
    expect(sg.subcircuit_id === null).toBe(false)
    expect(schematic_group.safeParse(sg).success).toBe(true)
  }
})
