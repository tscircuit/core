import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import simpleCircuitJson from "./assets/simple-circuit.json"

test.each([
  { num_layers: 2, thickness: 1.6, material: "fr4" },
  { num_layers: 4, thickness: 1.2, material: "fr4" },
  { num_layers: 4, thickness: 1.6, material: "flex" },
] as const)(
  "unsupported imported construction %j takes precedence over board props",
  async (construction) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        circuitJson={
          simpleCircuitJson.map((element) =>
            element.type === "pcb_board"
              ? { ...element, ...construction }
              : element,
          ) as any
        }
        fabricatorPreset="jlcpcb_standard"
        layers={4}
        thickness="1.6mm"
        material="fr4"
      />,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
    expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  },
)
