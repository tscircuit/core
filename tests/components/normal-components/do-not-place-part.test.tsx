import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("do not place part should be skipped", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        supplierPartNumbers={{
          jlcpcb: ["C965799"],
        }}
        doNotPlace
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcb_component = circuit
    .getCircuitJson()
    .filter((el) => el.type === "pcb_component")
  expect(pcb_component).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "do_not_place": true,
        "height": 4.41,
        +     "is_allowed_to_be_off_board": false,
        "layer": "top",
        "obstructs_within_bounds": true,
        "pcb_component_id": "pcb_component_0",
        "rotation": 0,
        "source_component_id": "source_component_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_component",
        "width": 5.3,
      },
    ]
  `)
})
