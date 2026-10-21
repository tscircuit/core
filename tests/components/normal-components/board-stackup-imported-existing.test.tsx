import { expect, test } from "bun:test"
import type { PcbStackup } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import simpleCircuitJson from "./assets/simple-circuit.json"

test("an imported stackup is preserved and reassociated without duplication", async () => {
  const stackup: PcbStackup = {
    type: "pcb_stackup",
    pcb_stackup_id: "pcb_stackup_imported",
    pcb_board_id: "pcb_board_imported",
    plated_hole_copper_thickness: 0.025,
    layers: [
      { layer_type: "copper", layer: "top", thickness: 0.035 },
      { layer_type: "dielectric", thickness: 1.2, relative_permittivity: 4.5 },
      { layer_type: "copper", layer: "inner1", thickness: 0.0152 },
      { layer_type: "dielectric", thickness: 0.1, relative_permittivity: 4.1 },
      { layer_type: "copper", layer: "inner2", thickness: 0.0152 },
      { layer_type: "dielectric", thickness: 0.1, relative_permittivity: 4.1 },
      { layer_type: "copper", layer: "bottom", thickness: 0.035 },
    ],
  }
  const importedJson = [
    ...simpleCircuitJson.map((element) =>
      element.type === "pcb_board"
        ? {
            ...element,
            pcb_board_id: "pcb_board_imported",
            num_layers: 4,
            thickness: 1.6,
            material: "fr4",
          }
        : element,
    ),
    stackup,
  ]
  const originalJson = structuredClone(importedJson)
  for (const fabricatorPreset of [undefined, "jlcpcb_standard"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        circuitJson={importedJson as any}
        layers={6}
        thickness={1.2}
        material="flex"
        fabricatorPreset={fabricatorPreset}
      />,
    )
    await circuit.renderUntilSettled()
    const stackups = circuit.db.pcb_stackup.list()
    expect(stackups).toHaveLength(1)
    expect(stackups[0]).toMatchObject({
      pcb_board_id: circuit.db.pcb_board.list()[0]!.pcb_board_id,
      subcircuit_id: circuit.db.pcb_board.list()[0]!.subcircuit_id,
      layers: stackup.layers,
      plated_hole_copper_thickness: 0.025,
    })
    expect(stackups[0]!.pcb_board_id).not.toBe(stackup.pcb_board_id)
    expect(stackups[0]!.pcb_stackup_id).toEqual(expect.any(String))
    expect(stackups[0]!.pcb_stackup_id).not.toBe(stackup.pcb_stackup_id)
    expect(importedJson).toEqual(originalJson)
  }
})
