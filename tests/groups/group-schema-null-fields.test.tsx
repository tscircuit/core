import { expect, test } from "bun:test"
import { pcb_group, schematic_group } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group emits schema-valid anchor_alignment and subcircuit_id", () => {
  const { circuit } = getTestFixture()
  // A plain group inside a board: not a subcircuit, no explicit pcb anchor.
  circuit.add(
    <board width="30mm" height="30mm">
      <group name="G1">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )
  circuit.render()

  const pcbGroup = circuit.db.pcb_group.list().find((g) => g.name === "G1")
  const schematicGroup = circuit.db.schematic_group
    .list()
    .find((g) => g.name === "G1")

  expect(pcbGroup).toBeDefined()
  expect(schematicGroup).toBeDefined()

  // A plain group used to write null into both of these fields. circuit-json
  // rejects null for both (anchor_alignment is an enum with a "center" default,
  // subcircuit_id is an optional string), so the emitted elements failed to parse.
  expect(pcbGroup!.anchor_alignment).not.toBeNull()
  expect(schematicGroup!.subcircuit_id).not.toBeNull()

  // Both elements now validate against their circuit-json schemas.
  expect(() => pcb_group.parse(pcbGroup)).not.toThrow()
  expect(() => schematic_group.parse(schematicGroup)).not.toThrow()

  // anchor_alignment is omitted, so the schema's own "center" default applies.
  expect(pcb_group.parse(pcbGroup).anchor_alignment).toBe("center")

  // A group placed outside any subcircuit legitimately has no subcircuit_id.
  expect(schematicGroup!.subcircuit_id).toBeUndefined()
})
