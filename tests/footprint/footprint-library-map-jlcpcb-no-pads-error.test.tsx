import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("jlcpcb footprint JSON without pads reports a load error", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({
          footprintCircuitJson: [
            {
              type: "cad_component",
              cad_component_id: "cad_component_0",
              pcb_component_id: "pcb_component_0",
              source_component_id: "source_component_0",
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              layer: "top",
            },
          ],
        }),
      },
    },
  })

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip name="J1" footprint="jlcpcb:C19268734" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.external_footprint_load_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]?.message).toContain("jlcpcb:C19268734")
  expect(errors[0]?.message).toMatch(/no pads|no PCB geometry/i)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(0)
})
