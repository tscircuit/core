import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbCopperPour } from "circuit-json"
import { findFloatingCopper } from "lib/utils/copper-pour-connectivity/find-floating-copper"

test("only generated copper pours are eligible for floating cleanup", () => {
  const authoredPourId: PcbCopperPour["pcb_copper_pour_id"] =
    "pcb_copper_pour_authored"
  const generatedPourId: PcbCopperPour["pcb_copper_pour_id"] =
    "pcb_copper_pour_generated"
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_net",
      source_net_id: "source_net_vcc",
      name: "VCC",
      member_source_group_ids: [],
      subcircuit_connectivity_map_key: "VCC",
    },
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: authoredPourId,
      source_net_id: "source_net_vcc",
      layer: "top",
      covered_with_solder_mask: false,
      shape: "polygon",
      points: [
        { x: -4, y: -1 },
        { x: -2, y: -1 },
        { x: -2, y: 1 },
        { x: -4, y: 1 },
      ],
    },
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: generatedPourId,
      source_net_id: "source_net_vcc",
      layer: "top",
      covered_with_solder_mask: false,
      shape: "polygon",
      points: [
        { x: 2, y: -1 },
        { x: 4, y: -1 },
        { x: 4, y: 1 },
        { x: 2, y: 1 },
      ],
    },
  ]

  const { floatingPourIds } = findFloatingCopper({
    circuitJson,
    removablePourIds: new Set([generatedPourId]),
  })

  expect(floatingPourIds).toEqual(new Set([generatedPourId]))
})
