import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/*
 * Validate that a non-subcircuit <group> that uses PCB flex layout is able to
 * auto-compute its own container size (via getMinimumFlexContainer) and render
 * successfully.
 */
test("pcb-flex-layout – group flex auto container", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group flex justifyContent="space-between" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
    </group>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})