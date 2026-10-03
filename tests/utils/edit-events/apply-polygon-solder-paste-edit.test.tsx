import { expect, test } from "bun:test"
import { getElementId } from "@tscircuit/circuit-json-util"
import { any_circuit_element } from "circuit-json"
import { applyEditEvents } from "lib/utils/edit-events/apply-edit-events-to-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual placement edits move polygon copper and paste together", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={12}>
      <chip
        name="U1"
        pcbX={-3}
        pcbY={-2}
        footprint={
          <footprint>
            <smtpad
              shape="polygon"
              points={[
                { x: 0, y: 0 },
                { x: 3, y: 0 },
                { x: 2, y: 2 },
                { x: 0, y: 1 },
              ]}
              portHints={["pin1"]}
              solderPasteMargin={0}
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="Manual move: polygon copper and zero-margin paste stay aligned"
        pcbY={5}
        fontSize={0.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const original = structuredClone(circuit.getCircuitJson())
  const pcbComponent = circuit.db.pcb_component.list()[0]!
  const edited = applyEditEvents({
    circuitJson: circuit.getCircuitJson(),
    editEvents: [
      {
        edit_event_type: "edit_pcb_component_location",
        pcb_edit_event_type: "edit_component_location",
        edit_event_id: "move_polygon",
        created_at: 0,
        pcb_component_id: pcbComponent.pcb_component_id,
        original_center: pcbComponent.center,
        new_center: {
          x: pcbComponent.center.x + 5,
          y: pcbComponent.center.y + 3,
        },
      },
    ],
  })
  for (const before of original) {
    if (
      (before.type !== "pcb_smtpad" && before.type !== "pcb_solder_paste") ||
      before.shape !== "polygon"
    )
      continue
    const after = edited.find(
      (polygon) => getElementId(polygon) === getElementId(before),
    )!
    if (
      (after.type !== "pcb_smtpad" && after.type !== "pcb_solder_paste") ||
      after.shape !== "polygon"
    )
      throw new Error("Expected moved polygon")
    expect(after.points).toEqual(
      before.points.map(({ x, y }) => ({ x: x + 5, y: y + 3 })),
    )
    expect(any_circuit_element.safeParse(after).success).toBe(true)
    expect(after).not.toHaveProperty("x")
    expect(after).not.toHaveProperty("y")
  }
  expect(circuit.getCircuitJson()).toEqual(original)
  await expect(edited).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
