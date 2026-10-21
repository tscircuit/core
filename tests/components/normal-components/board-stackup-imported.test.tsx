import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import simpleCircuitJson from "./assets/simple-circuit.json"

test.each([
  { fabricatorPreset: undefined, material: "fr4" },
  { fabricatorPreset: "jlcpcb_standard", material: "fr4" },
  { fabricatorPreset: "jlcpcb_standard", material: undefined },
] as const)(
  "an imported board resolves construction for %j",
  async ({ fabricatorPreset, material }) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        circuitJson={
          simpleCircuitJson.map((element) =>
            element.type === "pcb_board"
              ? { ...element, num_layers: 4, thickness: 1.6, material }
              : element,
          ) as any
        }
        fabricatorPreset={fabricatorPreset}
      />,
    )
    await circuit.renderUntilSettled()
    const stackups = circuit.db.pcb_stackup.list()
    expect(circuit.db.pcb_board.list()).toHaveLength(1)
    expect(stackups).toHaveLength(fabricatorPreset ? 1 : 0)
    if (!fabricatorPreset) return
    expect(stackups[0]).toMatchObject({
      pcb_board_id: circuit.db.pcb_board.list()[0]!.pcb_board_id,
      layers: expect.arrayContaining([
        {
          layer_type: "copper",
          layer: "inner1",
          thickness: 0.0152,
          electrical_conductivity_s_per_m: 5.8e7,
        },
      ]),
    })
  },
)
