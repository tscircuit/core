import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested group placement and standalone silkscreen emit schema-valid Circuit JSON", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={20}>
      <silkscreentext text="CONTROLLER" pcbY={8} fontSize={1} />
      <group name="POWER" pcbX={-5} pcbY={-2}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0603"
          pcbX={0}
          pcbY={-2}
        />
        <group name="FILTER" pcbX={4} pcbY={1} pcbPositionAnchor="top_left">
          <capacitor
            name="C1"
            capacitance="1uF"
            footprint="0603"
            pcbX={2}
            pcbY={0}
          />
          <silkscreentext text="FILTER" pcbY={2} fontSize={0.6} />
        </group>
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = JSON.parse(JSON.stringify(circuit.getCircuitJson()))
  const invalid = json.flatMap(
    (record: Parameters<typeof any_circuit_element.safeParse>[0]) => {
      const result = any_circuit_element.safeParse(record)
      return result.success ? [] : [{ record, issues: result.error.issues }]
    },
  )
  expect(invalid).toEqual([])
  const pcbGroup = circuit.db.pcb_group.getWhere({ name: "POWER" })!
  expect(pcbGroup).toMatchObject({
    anchor_alignment: "center",
    display_offset_x: "-5mm",
    display_offset_y: "-2mm",
  })
  const nestedGroup = circuit.db.pcb_group.getWhere({ name: "FILTER" })!
  expect(nestedGroup).toMatchObject({
    anchor_alignment: "top_left",
    display_offset_x: "4mm",
    display_offset_y: "1mm",
  })
  for (const schematicGroup of circuit.db.schematic_group.list()) {
    expect(schematicGroup.subcircuit_id).toBe(
      circuit.db.source_group.getWhere({ is_subcircuit: true })!.subcircuit_id,
    )
  }
  const label = circuit.db.pcb_silkscreen_text.getWhere({ text: "CONTROLLER" })!
  expect(label.pcb_component_id).toBeUndefined()
  expect(label.subcircuit_id).toBe(
    circuit.db.source_group.getWhere({ is_subcircuit: true })!.subcircuit_id,
  )
  expect(
    circuit.db.pcb_silkscreen_text.getWhere({ text: "FILTER" })!.pcb_group_id,
  ).toBe(nestedGroup.pcb_group_id)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbGroups: true })
})
