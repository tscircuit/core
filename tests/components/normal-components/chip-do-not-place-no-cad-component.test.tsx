import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with doNotPlace should not create cad_component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="soic8" doNotPlace />
    </board>,
  )

  await circuit.renderUntilSettled()

  const cad_components = circuit
    .getCircuitJson()
    .filter((el) => el.type === "cad_component")

  // When doNotPlace is true, there should be no cad_component created
  expect(cad_components).toHaveLength(0)

  // Verify that pcb_component still exists with do_not_place flag
  const pcb_components = circuit
    .getCircuitJson()
    .filter((el) => el.type === "pcb_component")
  expect(pcb_components).toHaveLength(1)
  expect(pcb_components[0]).toHaveProperty("do_not_place", true)
})
