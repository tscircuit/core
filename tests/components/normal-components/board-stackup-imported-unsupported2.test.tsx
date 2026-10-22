import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import simpleCircuitJson from "./assets/simple-circuit.json"

test("imported 4-layer 1.5mm fr4 construction takes precedence over board props", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      circuitJson={
        simpleCircuitJson.map((element) =>
          element.type === "pcb_board"
            ? { ...element, num_layers: 4, thickness: 1.5, material: "fr4" }
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
})
