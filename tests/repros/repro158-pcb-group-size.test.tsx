import { WirelessMCU_CC2745R10 } from "@tsci/tscircuit.ti"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro158: PCB group size", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <WirelessMCU_CC2745R10 name="ble_module" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const footprintOverlapErrors = circuit.db.pcb_footprint_overlap_error.list()
  expect(footprintOverlapErrors).toHaveLength(0)

  const pcb_groups = circuit.db.pcb_group.list()
  expect(pcb_groups).toMatchInlineSnapshot(`
    [
      {
        "anchor_alignment": null,
        "anchor_position": {
          "x": 0,
          "y": 0,
        },
        "autorouter_configuration": undefined,
        "center": {
          "x": -0.23499999999999943,
          "y": -0.28999999999999915,
        },
        "height": 25.04,
        "is_subcircuit": true,
        "name": "ble_module",
        "pcb_component_ids": [],
        "pcb_group_id": "pcb_group_0",
        "source_group_id": "source_group_0",
        "subcircuit_id": "subcircuit_source_group_0",
        "type": "pcb_group",
        "width": 19.41,
      },
    ]
  `)

  const pcb_boards = circuit.db.pcb_board.list()
  expect(pcb_boards).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": -0.23499999999999943,
          "y": -0.28999999999999915,
        },
        "height": 29.04,
        "material": "fr4",
        "min_board_edge_clearance": 0.2,
        "min_pad_edge_to_pad_edge_clearance": 0.1,
        "min_plated_hole_drill_edge_to_drill_edge_clearance": 0.15,
        "min_trace_to_pad_edge_clearance": 0.1,
        "min_trace_width": 0.1,
        "min_via_edge_to_pad_edge_clearance": undefined,
        "min_via_hole_diameter": 0.2,
        "min_via_hole_edge_to_via_hole_edge_clearance": 0.1,
        "min_via_pad_diameter": 0.3,
        "num_layers": 2,
        "outline": undefined,
        "pcb_board_id": "pcb_board_0",
        "source_board_id": "source_board_0",
        "thickness": 1.4,
        "type": "pcb_board",
        "width": 23.41,
      },
    ]
  `)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
